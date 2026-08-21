// 场景管理器

class SceneManager {
  constructor() {
    this.currentScene = null;
    this.background = document.getElementById('bg-image');
    this.characterLayer = document.getElementById('character-layer');

    this.init();
  }

  init() {
    // 预加载图片
    this.preloadImages();
  }

  // 预加载背景图片
  preloadImages() {
    const images = [];
    storyData.scenes.forEach(scene => {
      if (scene.background) {
        images.push(scene.background);
      }
    });

    images.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }

  // 加载场景
  async loadScene(sceneId) {
    const scene = storyData.scenes.find(s => s.id === sceneId);
    if (!scene) {
      console.error('场景不存在:', sceneId);
      return;
    }

    this.currentScene = scene;
    game.state.currentScene = sceneId;

    // 更新 HUD
    this.updateHUD(scene);

    // 加载背景
    if (scene.background) {
      await this.loadBackground(scene.background);
    }

    // 显示对话框
    dialogue.showDialogueBox();

    // 开始对话（逐句播放，全部播完返回）
    if (scene.dialogues) {
      await dialogue.startDialogue(scene.dialogues, scene.id);
    }

    // 显示选择
    if (scene.choices && scene.choices.length > 0) {
      await choices.showChoices(scene.choices);
    } else if (scene.historyPause && scene.historyPause.trigger) {
      // 无选择但有历史暂停（如第 4-7 章剧情推进）
      await choices.triggerHistoryPause(scene.historyPause);
    } else if (scene.isEnding) {
      // 结局动画（按人格播放专属片尾，可跳过，失败回退静帧）→ 革命报告
      await ui.playEndingVideo();
      gameInstance.end();
    }

    // 自动保存
    game.saveState();
  }

  // 加载背景
  loadBackground(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.background.src = src;
        this.background.classList.add('fade-in');
        setTimeout(() => this.background.classList.remove('fade-in'), 500);
        resolve();
      };
      img.onerror = () => {
        // 如果图片加载失败，使用渐变色背景
        this.background.style.background = 'linear-gradient(135deg, #2c1810, #5d4037)';
        resolve();
      };
      img.src = src;
    });
  }

  // 更新 HUD
  updateHUD(scene) {
    document.getElementById('year-display').textContent = scene.year || '1892';
    document.getElementById('location-display').textContent = scene.location || '马尼拉';

    // 播放对应 BGM（键 = scene.chapter，值 = audio.js 的 track 名）
    const bgmTrack = this.bgmTracks[scene.chapter] || 'colonial_atmosphere';
    if (bgmTrack) {
      audio.switchBGM(bgmTrack);
    }

    // 更新 stats
    this.updateStats();
  }

  // 更新状态显示
  updateStats() {
    const vars = game.state.variables;
    document.getElementById('hope-val').textContent = vars.hope;
    document.getElementById('fear-val').textContent = vars.fear;
    document.getElementById('trust-val').textContent = vars.trust;
    document.getElementById('support-val').textContent = vars.support;
    document.getElementById('alert-val').textContent = vars.alert;
  }

  // 跳转场景
  goToScene(sceneId) {
    this.loadScene(sceneId);
  }

  // 检查是否到达结局
  checkEnding() {
    if (this.currentScene && this.currentScene.isEnding) {
      return true;
    }
    return false;
  }
}

// 全局场景管理实例
const sceneManager = new SceneManager();

// BGM 映射（值必须是 audio.js bgmTracks 的 track 名）
sceneManager.bgmTracks = {
  prologue: 'colonial_atmosphere',
  1: 'colonial_atmosphere',
  2: 'revolutionary_march',
  3: 'revolutionary_march',
  4: 'sad_tragedy',
  5: 'sad_tragedy',
  6: 'revolutionary_march',
  7: 'sad_tragedy',
  ending: 'colonial_atmosphere'
};
