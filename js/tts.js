// TTS 语音系统

class TTSSystem {
  constructor() {
    this.synth = window.speechSynthesis;
    this.isSpeaking = false;
    this.currentUtterance = null;
    this.queue = [];
    this.enabled = true;

    // 语言配置
    this.languages = {
      zh: { name: '中文', lang: 'zh-CN', pitch: 1, rate: 0.9 },
      en: { name: 'English', lang: 'en-US', pitch: 1, rate: 0.9 }
    };

    this.currentLang = 'zh';
    this.voices = [];

    this.init();
  }

  init() {
    // 加载语音列表
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.loadVoices();
    }
    this.loadVoices();

    // 页面隐藏时暂停
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.synth.cancel();
      }
    });
  }

  loadVoices() {
    this.voices = this.synth.getVoices();
    console.log('可用语音:', this.voices.map(v => `${v.name} (${v.lang})`));
  }

  // 设置语言
  setLanguage(lang) {
    this.currentLang = lang;
  }

  // 获取当前语言的语音
  getVoice() {
    const langConfig = this.languages[this.currentLang];
    if (!langConfig) return null;

    // 优先选择中文语音
    if (this.currentLang === 'zh') {
      return this.voices.find(v => v.lang.includes('zh')) ||
             this.voices.find(v => v.lang.includes('zh-TW')) ||
             this.voices[0];
    }

    return this.voices.find(v => v.lang.includes('en')) || this.voices[0];
  }

  // 朗读文本
  speak(text, options = {}) {
    if (!this.enabled) return Promise.resolve();

    return new Promise((resolve) => {
      // 取消当前发音
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      // 配置语音
      const voice = options.voice || this.getVoice();
      if (voice) utterance.voice = voice;

      // 设置语言
      utterance.lang = options.lang || this.languages[this.currentLang].lang;

      // 设置音调和语速
      utterance.pitch = options.pitch || this.languages[options.lang || this.currentLang].pitch || 1;
      utterance.rate = options.rate || this.languages[options.lang || this.currentLang].rate || 0.9;

      // 事件处理
      utterance.onstart = () => {
        this.isSpeaking = true;
        if (options.onStart) options.onStart();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        if (options.onEnd) options.onEnd();
        resolve();
      };

      utterance.onerror = (event) => {
        // 被 cancel() 打断（切句/切页/暂停）是正常行为，静默处理
        const errType = event.error;
        if (errType !== 'canceled' && errType !== 'interrupted') {
          console.error('TTS 错误:', event);
        }
        this.isSpeaking = false;
        this.currentUtterance = null;
        if (options.onError) options.onError(event);
        resolve();
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    });
  }

  // 停止发音
  stop() {
    this.synth.cancel();
    this.isSpeaking = false;
    this.currentUtterance = null;
  }

  // 检查是否正在发音
  isSpeakingNow() {
    return this.synth.speaking;
  }

  // 朗读对话框文本（带打字机效果）
  async speakDialogue(text, element) {
    if (!this.enabled) return;

    // 等待打字机效果完成
    await new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (!element.classList.contains('typing')) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });

    // 朗读完整文本
    this.speak(text);
  }
}

// 全局 TTS 实例
const tts = new TTSSystem();
