// 游戏主循环

class Game {
  constructor() {
    this.isRunning = false;
    this.startTime = null;
  }

  async start() {
    console.log('🇵🇭 1896: Revolution of Choice 启动');

    this.isRunning = true;
    this.startTime = Date.now();

    // 合并云端记录（静默，失败则只用本地）
    await saver.loadFromCloud();

    // 检查是否有存档（本地或云端）
    if (saver.hasSave()) {
      await this.showStartMenu();
    } else {
      await this.showIntroduction();
    }
  }

  // 显示开始菜单
  async showStartMenu() {
    const menu = document.createElement('div');
    menu.id = 'start-menu';
    menu.innerHTML = `
      <div class="start-content">
        <h1>🇵🇭 1896: Revolution of Choice</h1>
        <h2>选择与革命</h2>
        <p>菲律宾独立运动沉浸体验</p>
        <button id="btn-pick-save">📜 选择进度（${saver.getRecords().length}）</button>
        <button id="btn-new-game">新的冒险</button>
      </div>
    `;
    document.body.appendChild(menu);

    document.getElementById('btn-pick-save').addEventListener('click', () => {
      menu.remove();
      ui.openSaveSelect();
    });

    document.getElementById('btn-new-game').addEventListener('click', () => {
      menu.remove();
      this.showIntroduction();
    });
  }

  // 显示介绍
  async showIntroduction() {
    const intro = document.createElement('div');
    intro.id = 'intro-screen';
    intro.innerHTML = `
      <div class="intro-content">
        <h1>1896: Revolution of Choice</h1>
        <h2>选择与革命</h2>
        <div class="intro-text">
          <p>1892年，菲律宾在马尼拉的殖民统治下挣扎求生。</p>
          <p>西班牙的压迫、社会的不公、人民的苦难……</p>
          <p>你将扮演一名普通的菲律宾青年，见证并参与这场改变历史的革命。</p>
          <p><strong>你的每一个选择，都将影响这段历史的走向。</strong></p>
        </div>
        <input type="text" id="player-name-input" placeholder="请输入你的名字..." maxlength="20">
        <button id="btn-start-game">开始革命</button>
      </div>
    `;
    document.body.appendChild(intro);

    document.getElementById('btn-start-game').addEventListener('click', () => {
      const name = document.getElementById('player-name-input').value.trim() || '革命者';
      saver.startNewGame(); // 开一个新存档槽
      game.state.playerName = name;
      intro.remove();
      sceneManager.loadScene('prologue_01');
    });

    // 回车确认
    document.getElementById('player-name-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('btn-start-game').click();
      }
    });
  }

  // 结束游戏
  end() {
    this.isRunning = false;

    // 计算游戏时间
    const playTime = Math.floor((Date.now() - this.startTime) / 60000);
    game.state.totalPlayTime = playTime;
    game.saveState();

    // 显示革命报告
    ui.showRevolutionReport();
  }

  // 检查游戏状态
  checkGameState() {
    // 检查是否到达结局
    if (sceneManager.checkEnding()) {
      this.end();
    }
  }
}

// 全局游戏实例
const gameInstance = new Game();

// 页面加载完成后启动游戏
window.addEventListener('DOMContentLoaded', () => {
  gameInstance.start();
});
