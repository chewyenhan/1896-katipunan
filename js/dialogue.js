// 对话系统

class DialogueSystem {
  constructor() {
    this.currentDialogue = null;
    this.dialogueIndex = 0;
    this.isTyping = false;
    this.typingInterval = null;
    this.typingCallback = null;
    this._advanceResolve = null;   // 等待玩家点击继续

    // DOM 元素
    this.speakerName = document.getElementById('speaker-name');
    this.speakerPortrait = document.getElementById('speaker-portrait');
    this.dialogueText = document.getElementById('dialogue-text');
    this.continueHint = document.getElementById('continue-hint');
    this.dialogueBox = document.getElementById('dialogue-box');

    this.init();
  }

  init() {
    // 点击继续
    this.dialogueBox.addEventListener('click', () => this.advance());

    // 键盘控制
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        this.advance();
      }
    });
  }

  // 开始对话——逐句播放，全部播完后 resolve
  async startDialogue(dialogues, sceneId) {
    this.currentDialogue = dialogues || [];
    this.dialogueIndex = 0;
    this.showDialogueBox();

    // 逐句播放
    while (this.dialogueIndex < this.currentDialogue.length) {
      const d = this.currentDialogue[this.dialogueIndex];
      this.showSpeaker(d);
      await this.typeText(d.text, sceneId, this.dialogueIndex);

      this.dialogueIndex++;
      this.continueHint.classList.remove('hidden');

      // 等待玩家点击"继续"（或按空格/回车）
      await this.waitForAdvance();
    }

    // 全部播完，隐藏对话框
    this.hideDialogueBox();
  }

  // 等待玩家点击继续
  waitForAdvance() {
    return new Promise((resolve) => {
      this._advanceResolve = resolve;
    });
  }

  // 显示说话者信息
  showSpeaker(dialogue) {
    // 显示名字
    if (dialogue.speaker !== 'narrator') {
      this.speakerName.textContent = dialogue.name || dialogue.speaker;
      this.speakerName.style.display = 'block';

      // 显示头像
      if (dialogue.portrait) {
        this.speakerPortrait.src = dialogue.portrait;
        this.speakerPortrait.style.display = 'block';
      } else {
        this.speakerPortrait.style.display = 'none';
      }
    } else {
      this.speakerName.textContent = '';
      this.speakerName.style.display = 'none';
      this.speakerPortrait.style.display = 'none';
    }
  }

  // 打字机效果
  typeText(text, sceneId, index) {
    return new Promise((resolve) => {
      this.isTyping = true;
      this.continueHint.classList.add('hidden');

      // 清空文本
      this.dialogueText.innerHTML = '';
      this.dialogueText.classList.add('typing');

      // 播放该句预生成语音（开场即读，符合语境语气）
      this.playLineVoice(sceneId, index, text);

      let i = 0;
      const speed = game.state.settings.fastForward ? 20 : 50;

      // 清除之前的定时器
      if (this.typingInterval) {
        clearInterval(this.typingInterval);
      }

      this.typingInterval = setInterval(() => {
        if (i < text.length) {
          this.dialogueText.textContent += text[i];
          i++;
        } else {
          this.finishTyping(resolve);
        }
      }, speed);

      // 点击跳过打字
      this.typingCallback = () => {
        if (this.isTyping) {
          clearInterval(this.typingInterval);
          this.dialogueText.textContent = text;
          this.finishTyping(resolve);
        }
      };

      this.dialogueText.addEventListener('click', this.typingCallback);
    });
  }

  // 完成打字
  finishTyping(resolve) {
    this.isTyping = false;
    this.dialogueText.classList.remove('typing');
    this.dialogueText.removeEventListener('click', this.typingCallback);
    resolve();
  }

  // 播放某句预生成语音（voice mp3 缺失时回退浏览器 TTS，保证不出错）
  playLineVoice(sceneId, index, text) {
    if (!game.state.settings.ttsEnabled) return;
    try { audio.stopVoice(); } catch (e) {}
    const path = `assets/audio/voices/${sceneId}_${index}.mp3`;
    audio.playVoice(path, () => {
      // 文件缺失 → 浏览器 TTS 兜底
      if (game.state.settings.ttsEnabled) {
        try { tts.speak(text).catch(() => {}); } catch (e) {}
      }
    });
  }

  // 前进
  advance() {
    if (this.isTyping) {
      // 如果正在打字，立即显示全部文本
      if (this.typingCallback) {
        this.typingCallback();
      }
      return;
    }

    // 播放音效
    try { audio.playSFX('click'); } catch (e) {}

    // 停掉上一句语音，防止重叠
    try { audio.stopVoice(); } catch (e) {}

    // 触发"继续"信号
    if (this._advanceResolve) {
      const resolve = this._advanceResolve;
      this._advanceResolve = null;
      resolve();
    }
  }

  // 隐藏对话框
  hideDialogueBox() {
    this.dialogueBox.classList.add('hidden');
    this.speakerName.textContent = '';
    this.speakerPortrait.style.display = 'none';
    this.dialogueText.textContent = '';
    this.continueHint.classList.add('hidden');
    try { audio.stopVoice(); } catch (e) {}
  }

  // 显示对话框
  showDialogueBox() {
    this.dialogueBox.classList.remove('hidden');
  }

  // 销毁
  destroy() {
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
    }
    this.dialogueText.removeEventListener('click', this.typingCallback);
  }
}

// 全局对话实例
const dialogue = new DialogueSystem();
