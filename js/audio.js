// 音频管理系统

class AudioSystem {
  constructor() {
    this.bgm = document.getElementById('bgm-audio');
    this.sfxClick = document.getElementById('sfx-click');
    this.sfxChoice = document.getElementById('sfx-choice');

    this.musicEnabled = true;
    this.volume = 0.5;        // 背景音乐音量（0~1，由右上角滑杆控制）
    this.voiceVolume = 1.0;   // 对话语音音量固定满格，不随 BGM 滑杆变化
    this.currentBGM = null;

  // BGM 配置（Kevin MacLeod / incompetech.com，CC-BY 4.0 免版权）
  //   colonial_atmosphere = "Teller of the Tales"
  //   revolutionary_march = "Five Armies"
  //   sad_tragedy         = "Heartbreaking"
  this.bgmTracks = {
    'colonial_atmosphere': 'assets/audio/bgm/colonial_atmosphere.mp3',
    'revolutionary_march': 'assets/audio/bgm/revolutionary_march.mp3',
    'sad_tragedy': 'assets/audio/bgm/sad_tragedy.mp3'
  };

    this.init();
  }

  init() {
    // 应用已保存的音量 / 音乐开关
    const s = game.state.settings;
    if (s && typeof s.volume === 'number') {
      this.volume = s.volume / 100;
    }
    if (s && s.musicEnabled === false) {
      this.musicEnabled = false;
    }
    this.bgm.volume = this.volume;
  }

  // 播放 BGM
  playBGM(trackName) {
    if (!this.musicEnabled) return;

    const track = this.bgmTracks[trackName];
    if (!track) {
      console.warn('BGM track not found:', trackName);
      return;
    }

    // 如果正在播放同一个，不重复播放
    if (this.currentBGM === track) return;

    this.bgm.src = track;
    this.bgm.loop = true;
    this.bgm.play().catch(e => {
      console.warn('BGM 播放失败（可能文件不存在）:', e);
    });

    this.currentBGM = track;
  }

  // 停止 BGM
  stopBGM() {
    this.bgm.pause();
    this.bgm.currentTime = 0;
    this.currentBGM = null;
  }

  // 切换 BGM
  switchBGM(newTrack) {
    this.stopBGM();
    this.playBGM(newTrack);
  }

  // 播放对话语音（预生成 mp3；文件缺失时回调 onError 以回退浏览器 TTS）
  playVoice(src, onError) {
    const el = document.getElementById('voice-audio');
    if (!el) return;
    el.src = src;
    el.volume = this.voiceVolume;
    el.onerror = () => { if (onError) onError(); };
    el.play().catch(() => { if (onError) onError(); });
  }

  // 停止对话语音
  stopVoice() {
    const el = document.getElementById('voice-audio');
    if (el) {
      el.pause();
      el.currentTime = 0;
    }
  }

  // 播放音效
  playSFX(sfxName) {
    let sfx;
    switch(sfxName) {
      case 'click':
        sfx = this.sfxClick;
        break;
      case 'choice':
        sfx = this.sfxChoice;
        break;
      default:
        return;
    }

    if (sfx) {
      sfx.currentTime = 0;
      sfx.play().catch(e => console.warn('音效播放失败:', e));
    }
  }

  // 设置音量
  setVolume(value) {
    this.volume = value;
    this.bgm.volume = value;
  }

  // 切换音乐开关
  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (!this.musicEnabled) {
      this.stopBGM();
    } else if (this.currentBGM) {
      this.playBGM(this.currentBGM);
    }
    return this.musicEnabled;
  }

  // 获取状态
  getState() {
    return {
      musicEnabled: this.musicEnabled,
      volume: this.volume
    };
  }
}

// 全局音频实例
const audio = new AudioSystem();
