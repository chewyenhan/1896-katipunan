// 存档系统（本地 localStorage + Cloudflare KV 云端）

class SaveSystem {
  constructor() {
    this.saveSlot = '1896_revolution_save';
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

  // 保存游戏（本地 + 云端）
  save() {
    const success = game.saveState();
    if (success) {
      this.showNotification('进度已保存');
      this.saveToCloud(); // 云端同步（不阻塞）
    } else {
      this.showNotification('保存失败', 'error');
    }
    return success;
  }

  // 保存到 Cloudflare KV（fire-and-forget）
  saveToCloud() {
    if (!this.cloudEnabled()) return;
    try {
      fetch(`${this.getCloudBase()}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: this.getPlayerId(), state: game.state }),
      }).catch(() => {});
    } catch (e) {
      // 云端不可用时静默，本地存档已足够
    }
  }

  // 从云端读取（异步；优先云端，否则回退本地）
  async loadFromCloud() {
    if (!this.cloudEnabled()) return false;
    try {
      const res = await fetch(`${this.getCloudBase()}/save?playerId=${encodeURIComponent(this.getPlayerId())}`);
      const data = await res.json();
      if (data && data.ok && data.state) {
        game.state = data.state;
        this.showNotification('已从云端读取进度');
        return true;
      }
    } catch (e) {
      // 静默回退本地
    }
    return false;
  }

  // 加载游戏（本地）
  load() {
    const state = game.loadState();
    if (state) {
      game.state = state;
      this.showNotification('进度已加载');
      return true;
    } else {
      this.showNotification('没有找到存档', 'error');
      return false;
    }
  }

  // 删除存档
  deleteSave() {
    localStorage.removeItem(this.saveSlot);
    this.showNotification('存档已删除');
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

  // 检查是否有存档
  hasSave() {
    return !!localStorage.getItem(this.saveSlot);
  }
}

// 全局存档实例
const saver = new SaveSystem();
