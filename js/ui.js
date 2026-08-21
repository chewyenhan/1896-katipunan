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
      saver.save();
    });

    document.getElementById('btn-load').addEventListener('click', async () => {
      // 云端优先，云端没有才读本地
      const cloudOk = await saver.loadFromCloud();
      if (!cloudOk && !saver.load()) return;
      this.closeMenu();
      sceneManager.loadScene(game.state.currentScene);
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
        if (!this.menuOverlay.classList.contains('hidden')) {
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

  // 显示革命报告
  showRevolutionReport() {
    const report = game.getReportData();
    const totalScore = this.computeTotalScore();
    const grade = this.getGrade(totalScore);

    // 综合表现打分
    document.getElementById('report-score').innerHTML = `
      <div class="score-panel ${grade.cls}">
        <div class="score-number">${totalScore}<span class="score-max"> / 100</span></div>
        <div class="score-grade">${grade.grade} 级 · ${grade.label}</div>
        <div class="score-note">综合表现得分（关键选择的革命认同度）</div>
      </div>
    `;

    const statsHTML = Object.entries(report).map(([key, value]) => `
      <div class="stat-bar">
        <span class="label">${this.getStatName(key)}</span>
        <div class="bar"><div class="fill" style="width: ${value}%"></div></div>
        <span class="value">${value}</span>
      </div>
    `).join('');

    document.getElementById('report-stats').innerHTML = statsHTML;
    document.getElementById('report-personality').innerHTML = `
      <p><strong>革命人格：</strong>${this.getPersonalityType(report)}</p>
      <p>${this.getPersonalityDescription(report)}</p>
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
    this.submitAndLoadLeaderboard(totalScore, grade.label);
  }

  // 计算综合得分：所选选项 score 的平均值（0-100）
  computeTotalScore() {
    let total = 0, count = 0;
    for (const c of game.state.choices) {
      const scene = storyData.scenes.find(s => s.id === c.scene);
      if (!scene || !scene.choices) continue;
      // 与 choice.js 相同：按条件过滤后取索引
      const validChoices = scene.choices.filter(ch => !ch.condition || game.checkCondition(ch.condition));
      const choice = validChoices[c.choice];
      if (choice && typeof choice.score === 'number') {
        total += choice.score;
        count++;
      }
    }
    return count ? Math.round(total / count) : 0;
  }

  // 评级
  getGrade(score) {
    if (score >= 85) return { grade: 'S', label: '革命先驱', cls: 'grade-s' };
    if (score >= 70) return { grade: 'A', label: '坚定革命者', cls: 'grade-a' };
    if (score >= 55) return { grade: 'B', label: '觉醒青年', cls: 'grade-b' };
    if (score >= 40) return { grade: 'C', label: '旁观者', cls: 'grade-c' };
    return { grade: 'D', label: '沉默的大多数', cls: 'grade-d' };
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

      const lbRes = await fetch(`${base}/leaderboard`);
      const lb = await lbRes.json();
      const rows = (lb && lb.leaderboard) || [];
      const medal = ['🥇', '🥈', '🥉'];

      const rowsHTML = rows.slice(0, 10).map((e, i) => `
        <div class="lb-row ${e.id === saver.getPlayerId() ? 'lb-me' : ''}">
          <span class="lb-rank">${medal[i] || (i + 1)}</span>
          <span class="lb-name">${this.escapeHtml(e.name)}</span>
          <span class="lb-personality">${this.escapeHtml(e.personality || '')}</span>
          <span class="lb-score">${e.score}</span>
        </div>
      `).join('');

      const myIndex = rows.findIndex(e => e.id === saver.getPlayerId());
      const myRank = myIndex >= 0 ? myIndex + 1 : '-';

      box.innerHTML = `
        <h3>🏆 革命排行榜（前 10）</h3>
        <div class="lb-list">${rowsHTML || '<p class="lb-empty">还没有人上榜，快来争第一！</p>'}</div>
        <p class="lb-mine">${myRank === '-' ? '我的成绩已保存到云端' : `我的排名：#${myRank}`}</p>
      `;
    } catch (e) {
      box.innerHTML = `<p class="lb-status">云端暂不可用，成绩仅保存在本地</p>`;
    }
  }

  // HTML 转义（排行榜姓名防注入）
  escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  // 获取统计名称
  getStatName(key) {
    const names = {
      courage: '勇气',
      loyalty: '忠诚',
      politicalSense: '政治敏锐',
      riskTaking: '风险承受',
      compassion: '同情心',
      leadership: '领导力'
    };
    return names[key] || key;
  }

  // 获取人格类型
  getPersonalityType(report) {
    const maxStat = Object.entries(report).reduce((a, b) => a[1] > b[1] ? a : b);

    const types = {
      courage: '勇敢的战士',
      loyalty: '忠诚的同志',
      politicalSense: '精明的政治家',
      riskTaking: '冒险的革命者',
      compassion: '仁慈的理想主义者',
      leadership: '天生的领袖'
    };

    return types[maxStat[0]] || '坚定的革命者';
  }

  // 获取人格描述
  getPersonalityDescription(report) {
    return '基于你的选择，你在革命中更重视' +
      (report.courage > 70 ? '勇敢抗争' : '') +
      (report.loyalty > 70 ? '同志情谊' : '') +
      (report.politicalSense > 70 ? '政治智慧' : '') +
      (report.riskTaking > 70 ? '冒险精神' : '') +
      (report.compassion > 70 ? '人道关怀' : '') +
      (report.leadership > 70 ? '领导责任' : '') +
      '。';
  }
}

// 全局 UI 实例
const ui = new UISystem();
