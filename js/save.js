// 存档系统（多存档：本地 localStorage + Cloudflare KV 云端）
// 本地结构：
//   '1896_saves'            记录数组 [{ saveId, playerName, currentScene, chapter, hope, updatedAt, state }]
//   '1896_current_save_id'  当前活动的存档 id
//   '1896_player_id'        持久玩家 ID（跨设备同步用）
// 旧版单槽存档 '1896_revolution_save' 会在首次读取时自动迁移成一条 'legacy' 记录

class SaveSystem {
  constructor() {
    this.saveListSlot = '1896_saves';
    this.currentSlot = '1896_current_save_id';
    this.legacySlot = '1896_revolution_save';
    this.playerIdSlot = '1896_player_id';
  }

  // 持久玩家 ID（首次生成，跨设备恢复存档用）
  getPlayerId() {
    let id = localStorage.getItem(this.playerIdSlot);
    if (!id) {
      id = 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(this.playerIdSlot, id);
    }
    return id;
  }

  // Cloudflare API 基础地址
  getCloudBase() {
    return (settingsData && settingsData.cloud && settingsData.cloud.baseUrl) || '';
  }

  cloudEnabled() {
    return this.getCloudBase() && settingsData.cloud.saveEnabled;
  }

  // 生成一条记录（从 state 提取摘要字段）
  makeRecord(saveId, state) {
    return {
      saveId,
      playerName: String((state && state.playerName) || '革命者').slice(0, 20),
      currentScene: String((state && state.currentScene) || 'prologue_01'),
      chapter: (state && state.currentChapter) || 0,
      hope: (state && state.variables && state.variables.hope) || 0,
      updatedAt: Date.now(),
      state,
    };
  }

  // 读取本地记录数组（含旧版单槽存档迁移）
  getRecords() {
    let records = [];
    try {
      records = JSON.parse(localStorage.getItem(this.saveListSlot)) || [];
      if (!Array.isArray(records)) records = [];
    } catch (e) {
      records = [];
    }

    // 旧版单槽存档迁移：1896_revolution_save → 一条 legacy 记录
    const legacy = localStorage.getItem(this.legacySlot);
    if (legacy) {
      try {
        const legacyState = JSON.parse(legacy);
        if (!records.some(r => r.saveId === 'legacy')) {
          records.push(this.makeRecord('legacy', legacyState));
        }
      } catch (e) {
        // 旧档损坏则丢弃
      }
      localStorage.removeItem(this.legacySlot); // 迁移后清理
    }

    return records.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }

  persistRecords(records) {
    try {
      localStorage.setItem(this.saveListSlot, JSON.stringify(records.slice(0, 20)));
      return true;
    } catch (e) {
      return false;
    }
  }

  getCurrentSaveId() {
    return localStorage.getItem(this.currentSlot) || '';
  }

  setCurrentSaveId(id) {
    if (id) localStorage.setItem(this.currentSlot, id);
    else localStorage.removeItem(this.currentSlot);
  }

  // 开始新游戏：创建一个新存档槽并立即落盘
  startNewGame() {
    const saveId = 's_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    this.setCurrentSaveId(saveId);
    this.save();
    return saveId;
  }

  // 保存当前 game.state 到当前存档槽（无槽则新建）
  save() {
    try {
      let saveId = this.getCurrentSaveId();
      if (!saveId) {
        saveId = 's_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
        this.setCurrentSaveId(saveId);
      }

      const records = this.getRecords();
      const record = this.makeRecord(saveId, game.state);
      const idx = records.findIndex(r => r.saveId === saveId);
      if (idx >= 0) records[idx] = record;
      else records.unshift(record);

      this.persistRecords(records);
      this.saveToCloud(saveId); // 云端同步（不阻塞）
      return true;
    } catch (e) {
      console.error('保存存档失败:', e);
      return false;
    }
  }

  // 保存到 Cloudflare KV（fire-and-forget，按 saveId upsert）
  saveToCloud(saveId) {
    if (!this.cloudEnabled()) return;
    try {
      fetch(`${this.getCloudBase()}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: this.getPlayerId(), saveId, state: game.state }),
      }).catch(() => {});
    } catch (e) {
      // 云端不可用时静默，本地存档已足够
    }
  }

  // 从云端拉取全部记录并合并到本地（5 秒超时，避免卡住启动）
  async loadFromCloud() {
    if (!this.cloudEnabled()) return false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(`${this.getCloudBase()}/save?playerId=${encodeURIComponent(this.getPlayerId())}`, {
        signal: controller.signal,
      });
      const data = await res.json();
      if (data && data.ok && Array.isArray(data.records)) {
        this.mergeCloudRecords(data.records);
        return true;
      }
    } catch (e) {
      // 超时或不可用，静默回退本地
    } finally {
      clearTimeout(timer);
    }
    return false;
  }

  // 云端记录合并到本地（同 id 取较新者，新 id 追加）
  mergeCloudRecords(cloudRecords) {
    const local = this.getRecords();
    const merged = [...local];
    for (const cr of cloudRecords) {
      if (!cr || !cr.saveId) continue;
      const idx = merged.findIndex(r => r.saveId === cr.saveId);
      if (idx >= 0) {
        if (!merged[idx].state || (cr.updatedAt || 0) > (merged[idx].updatedAt || 0)) {
          merged[idx] = cr;
        }
      } else {
        merged.push(cr);
      }
    }
    this.persistRecords(merged.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)));
  }

  // 选择一条记录载入为当前游戏状态
  selectSave(saveId) {
    const rec = this.getRecords().find(r => r.saveId === saveId);
    if (!rec || !rec.state) return false;
    game.state = rec.state;
    this.setCurrentSaveId(saveId);
    return true;
  }

  // 删除一条记录（本地 + 云端）
  async deleteSave(saveId) {
    const records = this.getRecords().filter(r => r.saveId !== saveId);
    this.persistRecords(records);
    if (this.getCurrentSaveId() === saveId) this.setCurrentSaveId('');

    if (this.cloudEnabled()) {
      try {
        await fetch(
          `${this.getCloudBase()}/save?playerId=${encodeURIComponent(this.getPlayerId())}&saveId=${encodeURIComponent(saveId)}`,
          { method: 'DELETE' }
        ).catch(() => {});
      } catch (e) {
        // 云端删除失败不影响本地
      }
    }
  }

  // 显示通知
  showNotification(message, type = 'success') {
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.textContent = message;
    document.body.appendChild(notif);

    setTimeout(() => {
      notif.classList.add('fade-out');
      setTimeout(() => notif.remove(), 500);
    }, 2000);
  }

  // 是否有任何存档（本地或已合并的云端）
  hasSave() {
    return this.getRecords().length > 0;
  }
}

// 全局存档实例
const saver = new SaveSystem();
