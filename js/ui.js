// UI 控制系统

class UISystem {
  constructor() {
    this.menuOverlay = document.getElementById('menu-overlay');
    this.settingsOverlay = document.getElementById('settings-overlay');
    this.historyPause = document.getElementById('history-pause');
    this.revolutionReport = document.getElementById('revolution-report');

    this.init();
  }

  init() {
    // 菜单按钮
    document.getElementById('btn-continue').addEventListener('click', () => {
      this.closeMenu();
    });

    document.getElementById('btn-save').addEventListener('click', () => {
      if (saver.save()) {
        this.closeMenu();
        saver.showNotification('进度已保存');
      } else {
        saver.showNotification('保存失败', 'error');
      }
    });

    document.getElementById('btn-load').addEventListener('click', () => {
      this.closeMenu();
      this.openSaveSelect();
    });

    document.getElementById('btn-settings').addEventListener('click', () => {
      this.openSettings();
    });

    document.getElementById('btn-restart').addEventListener('click', () => {
      if (confirm('确定要重新开始吗？进度将丢失。')) {
        game.resetState();
        this.closeMenu();
        sceneManager.loadScene('prologue_01');
      }
    });

    document.getElementById('btn-exit').addEventListener('click', () => {
      if (confirm('确定要退出游戏吗？')) {
        location.reload();
      }
    });

    // 设置按钮
    document.getElementById('btn-close-settings').addEventListener('click', () => {
      this.closeSettings();
    });

    document.getElementById('btn-close-save-list').addEventListener('click', () => {
      this.closeSaveSelect();
    });

    document.getElementById('tts-toggle').addEventListener('change', (e) => {
      game.state.settings.ttsEnabled = e.target.checked;
    });

    document.getElementById('music-toggle').addEventListener('change', (e) => {
      audio.toggleMusic();
    });

    document.getElementById('volume-slider').addEventListener('input', (e) => {
      const volume = parseInt(e.target.value);
      game.state.settings.volume = volume;
      audio.setVolume(volume / 100);
      document.getElementById('volume-value').textContent = volume;
      document.getElementById('hud-volume-slider').value = volume;
    });

    // HUD 音量滑条（与设置面板双向同步 + 持久化）
    const hudVolSlider = document.getElementById('hud-volume-slider');
    const hudVolBtn = document.getElementById('hud-volume-btn');

    hudVolSlider.addEventListener('input', (e) => {
      const volume = parseInt(e.target.value);
      game.state.settings.volume = volume;
      audio.setVolume(volume / 100);
      document.getElementById('volume-value').textContent = volume;
      document.getElementById('volume-slider').value = volume;
      game.saveState();
    });

    hudVolBtn.addEventListener('click', () => {
      const enabled = audio.toggleMusic();
      hudVolBtn.textContent = enabled ? '🔊' : '🔇';
      document.getElementById('music-toggle').checked = enabled;
      game.state.settings.musicEnabled = enabled;
      game.saveState();
    });

    // 初始化 HUD 音量控件状态
    this.syncHUDVolume();

    // History Pause 继续按钮
    document.getElementById('continue-history').addEventListener('click', () => {
      this.historyPause.classList.add('hidden');
    });

    // 革命报告完成按钮
    document.getElementById('btn-finish').addEventListener('click', () => {
      this.revolutionReport.classList.add('hidden');
    });

    // 革命报告：重新开始
    document.getElementById('btn-restart-report').addEventListener('click', () => {
      this.revolutionReport.classList.add('hidden');
      game.resetState();
      sceneManager.loadScene('prologue_01');
    });

    // ESC 键
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        if (this.saveSelect && !this.saveSelect.classList.contains('hidden')) {
          this.closeSaveSelect();
        } else if (!this.menuOverlay.classList.contains('hidden')) {
          this.closeMenu();
        } else if (!this.settingsOverlay.classList.contains('hidden')) {
          this.closeSettings();
        } else {
          this.openMenu();
        }
      }
    });
  }

  // 打开菜单
  openMenu() {
    this.menuOverlay.classList.remove('hidden');
  }

  // 关闭菜单
  closeMenu() {
    this.menuOverlay.classList.add('hidden');
  }

  // 打开设置
  openSettings() {
    this.settingsOverlay.classList.remove('hidden');

    // 同步当前设置
    document.getElementById('tts-toggle').checked = game.state.settings.ttsEnabled;
    document.getElementById('music-toggle').checked = audio.musicEnabled;
    document.getElementById('volume-slider').value = game.state.settings.volume;
    document.getElementById('volume-value').textContent = game.state.settings.volume;
    this.syncHUDVolume();
  }

  // 同步 HUD 音量控件（数值 + 静音图标）
  syncHUDVolume() {
    const slider = document.getElementById('hud-volume-slider');
    const btn = document.getElementById('hud-volume-btn');
    if (!slider || !btn) return;
    slider.value = game.state.settings.volume;
    btn.textContent = audio.musicEnabled ? '🔊' : '🔇';
  }

  // 关闭设置
  closeSettings() {
    this.settingsOverlay.classList.add('hidden');
  }

  // ===== 存档选择面板 =====
  async openSaveSelect() {
    this.saveSelect = this.saveSelect || document.getElementById('save-select-overlay');
    const listBox = document.getElementById('save-list');
    listBox.innerHTML = `<p class="save-status">正在读取存档…</p>`;
    this.saveSelect.classList.remove('hidden');
    await saver.loadFromCloud(); // 先合并云端记录
    this.renderSaveList();
  }

  renderSaveList() {
    const records = saver.getRecords();
    const listBox = document.getElementById('save-list');
    if (!listBox) return;

    if (!records.length) {
      listBox.innerHTML = `<p class="save-empty">还没有存档，去开始一段革命吧！</p>`;
      return;
    }

    listBox.innerHTML = records.map(rec => {
      const scene = storyData.scenes.find(s => s.id === rec.currentScene);
      const title = scene ? `${this.chapterLabel(scene.chapter)} · ${scene.title}` : rec.currentScene;
      const isCurrent = rec.saveId === saver.getCurrentSaveId();
      return `
        <div class="save-row ${isCurrent ? 'save-current' : ''}">
          <div class="save-info">
            <div class="save-name">${this.escapeHtml(rec.playerName)}<span class="save-chapter">${title}</span></div>
            <div class="save-meta">❤ 希望 ${rec.hope} · ${this.formatDate(rec.updatedAt)}${isCurrent ? ' · 当前' : ''}</div>
          </div>
          <div class="save-actions">
            <button class="save-enter" data-save-id="${rec.saveId}">进入</button>
            <button class="save-delete" data-save-id="${rec.saveId}">删除</button>
          </div>
        </div>
      `;
    }).join('');

    listBox.querySelectorAll('.save-enter').forEach(btn => {
      btn.addEventListener('click', async () => {
        const ok = await saver.selectSave(btn.dataset.saveId);
        if (!ok) { saver.showNotification('载入失败', 'error'); return; }
        this.saveSelect.classList.add('hidden');
        sceneManager.loadScene(game.state.currentScene);
      });
    });

    listBox.querySelectorAll('.save-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        const rec = records.find(r => r.saveId === btn.dataset.saveId);
        if (!confirm(`确定删除「${rec ? rec.playerName : '这段'}」的进度吗？删除后不可恢复。`)) return;
        await saver.deleteSave(btn.dataset.saveId);
        this.renderSaveList();
      });
    });
  }

  closeSaveSelect() {
    if (this.saveSelect) this.saveSelect.classList.add('hidden');
  }

  chapterLabel(ch) {
    if (ch === 'prologue') return '序章';
    if (ch === 'ending') return '终章';
    return `第${ch}章`;
  }

  formatDate(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // 结局动画：按人格播放专属片尾（可跳过；视频失败回退静帧+Ken Burns）
  playEndingVideo() {
    const overlay = document.getElementById('ending-video-overlay');
    const video = document.getElementById('ending-video');
    const fallback = document.getElementById('ending-video-fallback');
    const titleEl = document.getElementById('ending-video-title');
    const subEl = document.getElementById('ending-video-subtitle');
    const skipBtn = document.getElementById('btn-skip-ending');

    const META = {
      courage:         { mp4: 'ending_courage.mp4',    frame: 'frame_courage.jpg',    title: '勇敢的战士',         sub: '以火为旗，以身为盾。' },
      loyalty:         { mp4: 'ending_loyalty.mp4',    frame: 'frame_loyalty.jpg',    title: '忠诚的同志',         sub: '歃血为盟，至死不渝。' },
      politicalSense:  { mp4: 'ending_political.mp4',  frame: 'frame_political.jpg',  title: '精明的政治家',       sub: '博弈之间，家国为先。' },
      riskTaking:      { mp4: 'ending_risk.mp4',       frame: 'frame_risk.jpg',       title: '冒险的革命者',       sub: '明知山有虎，偏向虎山行。' },
      compassion:      { mp4: 'ending_compassion.mp4', frame: 'frame_compassion.jpg', title: '仁慈的理想主义者',   sub: '为苍生请命，以纸笔为剑。' },
      leadership:      { mp4: 'ending_leadership.mp4', frame: 'frame_leadership.jpg', title: '天生的领袖',         sub: '振臂一呼，应者云集。' },
    };

    // 人格倾向与综合成绩分开计算；动画由选择累积的人格点决定
    const report = this.getScoringReport();
    const meta = META[report.personalityKey] || META.courage;
    const vidUrl = `assets/endings/${meta.mp4}`;
    const frameUrl = `assets/endings/${meta.frame}`;

    return new Promise((resolve) => {
      let done = false;
      let fallbackTimer = null;
      let playTimeout = null;

      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(playTimeout);
        clearTimeout(fallbackTimer);
        video.pause();
        video.removeAttribute('src'); // 释放内存
        video.load();
        fallback.classList.add('hidden');
        video.classList.remove('hidden');
        overlay.classList.add('hidden');
        resolve();
      };

      const fallbackToFrame = () => {
        if (done) return;
        video.classList.add('hidden');
        fallback.src = frameUrl;
        fallback.classList.remove('hidden');
        // 静帧模式 10 秒后自动进入结算（等同动画时长）
        fallbackTimer = setTimeout(finish, 10000);
      };

      overlay.classList.remove('hidden');
      titleEl.textContent = meta.title;
      this.typeText(subEl, meta.sub);

      skipBtn.onclick = finish;
      video.onended = finish;
      video.onerror = fallbackToFrame;
      video.onplaying = () => clearTimeout(playTimeout);

      video.src = vidUrl;
      const p = video.play();
      if (p && p.catch) p.catch(fallbackToFrame);
      // 5 秒内未开始播放 → 静帧回退（onplaying 会清掉这个 timeout）
      playTimeout = setTimeout(() => {
        if (!done && video.currentTime === 0) fallbackToFrame();
      }, 5000);
    });
  }

  // 打字机效果（副标题）
  typeText(el, text) {
    el.textContent = '';
    let i = 0;
    el.classList.add('type-cursor');
    const iv = setInterval(() => {
      el.textContent = text.slice(0, ++i);
      if (i >= text.length) {
        clearInterval(iv);
        el.classList.remove('type-cursor');
      }
    }, 60);
  }

  // 显示革命报告
  showRevolutionReport() {
    const report = this.getScoringReport();
    if (!report.complete) {
      document.getElementById('report-score').innerHTML =
        '<div class="score-panel grade-d">成绩资料不完整，无法计算。</div>';
      document.getElementById('report-stats').innerHTML = '';
      document.getElementById('report-personality').innerHTML = '';
      document.getElementById('report-leaderboard').innerHTML = '';
      this.revolutionReport.classList.remove('hidden');
      return;
    }
    const totalScore = report.totalScore;
    const grade = report.grade;

    // 综合表现打分
    document.getElementById('report-score').innerHTML = `
      <div class="score-panel ${grade.cls}">
        <div class="score-number">${totalScore}<span class="score-max"> / 100</span></div>
        <div class="score-grade">${grade.grade} 级 · ${grade.prefix}${report.personalityLabel}</div>
        <div class="score-note">历史判断 40% · 革命意志 35% · 团队责任 25%</div>
      </div>
    `;

    const dimensionNames = {
      historicalJudgment: '历史判断',
      revolutionaryWill: '革命意志',
      teamResponsibility: '团队责任'
    };
    const statsHTML = Object.entries(report.dimensions).map(([key, value]) => `
      <div class="stat-bar">
        <span class="label">${dimensionNames[key]}</span>
        <div class="bar"><div class="fill" style="width: ${value}%"></div></div>
        <span class="value">${value}</span>
      </div>
    `).join('');

    document.getElementById('report-stats').innerHTML = statsHTML;
    document.getElementById('report-personality').innerHTML = `
      <p><strong>革命人格：</strong>${report.personalityLabel}</p>
      <p>${grade.grade === 'D'
        ? '你的行动风格已经形成，但还需要更主动地理解局势并承担集体责任。'
        : '你的选择体现了独特的革命道路；人格类型不代表高低，总分反映综合判断。'}</p>
    `;

    document.getElementById('report-exam-mapping').innerHTML = `
      <h3>考纲对应知识点</h3>
      <ul>
        <li>2.4.2.2 菲律宾宣传运动与卡地普南武装斗争</li>
        <li>2.4.2.3 印、菲、缅的独立经过</li>
        <li>2.4.2.4 军人独裁的东南亚国家——菲律宾</li>
      </ul>
    `;

    this.revolutionReport.classList.remove('hidden');

    // 云端排行榜（提交成绩 + 拉取榜单）
    this.submitAndLoadLeaderboard(totalScore, `${grade.prefix}${report.personalityLabel}`);
  }

  getScoringReport() {
    return ScoringSystem.computeReport(game.state.choices, storyData);
  }

  // 提交成绩 + 拉取排行榜（Cloudflare KV）
  async submitAndLoadLeaderboard(totalScore, gradeLabel) {
    const base = (settingsData && settingsData.cloud && settingsData.cloud.baseUrl) || '';
    const box = document.getElementById('report-leaderboard');
    if (!base) {
      box.innerHTML = `<p class="lb-status">云端排行榜未启用</p>`;
      return;
    }
    box.innerHTML = `<p class="lb-status">正在保存成绩…</p>`;

    try {
      const res = await fetch(`${base}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: saver.getPlayerId(),
          name: game.state.playerName || '革命者',
          score: totalScore,
          personality: gradeLabel,
          totalPlayTime: game.state.totalPlayTime || 0,
        }),
      });
      await res.json();
      await this.loadLeaderboard();
    } catch (e) {
      box.innerHTML = `<p class="lb-status">云端暂不可用，成绩仅保存在本地</p>`;
    }
  }

  // 拉取并渲染排行榜（提交后 / 删除记录后都走这里）
  async loadLeaderboard() {
    const base = (settingsData && settingsData.cloud && settingsData.cloud.baseUrl) || '';
    const box = document.getElementById('report-leaderboard');
    if (!base) {
      box.innerHTML = `<p class="lb-status">云端排行榜未启用</p>`;
      return;
    }
    const lbRes = await fetch(`${base}/leaderboard`);
    const lb = await lbRes.json();
    const rows = (lb && lb.leaderboard) || [];
    const medal = ['🥇', '🥈', '🥉'];
    const me = saver.getPlayerId();

    const rowsHTML = rows.slice(0, 10).map((e, i) => `
      <div class="lb-row ${e.id === me ? 'lb-me' : ''}">
        <span class="lb-rank">${medal[i] || (i + 1)}</span>
        <span class="lb-name">${this.escapeHtml(e.name)}</span>
        <span class="lb-personality">${this.escapeHtml(e.personality || '')}</span>
        <span class="lb-score">${e.score}</span>
        <button class="lb-del" data-id="${this.escapeHtml(e.id)}" data-name="${this.escapeHtml(e.name)}" title="删除记录">×</button>
      </div>
    `).join('');

    const myIndex = rows.findIndex(e => e.id === me);
    const myRank = myIndex >= 0 ? myIndex + 1 : '-';

    box.innerHTML = `
      <h3>🏆 革命排行榜（前 10）</h3>
      <div class="lb-list">${rowsHTML || '<p class="lb-empty">还没有人上榜，快来争第一！</p>'}</div>
      <p class="lb-mine">${myRank === '-' ? '我的成绩已保存到云端' : `我的排名：#${myRank}`}</p>
    `;
    this.bindLeaderboardDelete(box, base, me);
  }

  // 删除按钮：删自己的记录免密码（playerId 随机不可猜）；删别人的需管理密码（教师用）
  bindLeaderboardDelete(box, base, me) {
    box.querySelectorAll('.lb-del').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const name = btn.dataset.name;
        let url = `${base}/leaderboard?id=${encodeURIComponent(id)}`;
        if (id === me) {
          if (!confirm(`确定删除「${name}」的排行榜记录吗？`)) return;
        } else {
          const pwd = prompt(`删除「${name}」的记录需要管理密码（教师用）：`);
          if (!pwd) return;
          url += `&admin=${encodeURIComponent(pwd)}`;
        }
        try {
          const res = await fetch(url, { method: 'DELETE' });
          const data = await res.json();
          if (data.ok) {
            if (data.removed === 0) alert('该记录不存在');
            else await this.loadLeaderboard();
          } else {
            alert(data.error || '删除失败');
          }
        } catch (e) {
          alert('网络错误，删除失败');
        }
      };
    });
  }

  // HTML 转义（排行榜姓名防注入）
  escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

}

// 全局 UI 实例
const ui = new UISystem();
