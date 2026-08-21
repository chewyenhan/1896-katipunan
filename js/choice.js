// 选择系统

class ChoiceSystem {
  constructor() {
    this.container = document.getElementById('choices-container');
    this.buttons = this.container.querySelectorAll('.choice-btn');
    this.currentChoices = null;
    this.isProcessing = false;

    this.init();
  }

  init() {
    this.buttons.forEach((btn, index) => {
      btn.addEventListener('click', () => this.selectChoice(index));
    });
  }

  // 显示选择
  async showChoices(choices) {
    return new Promise((resolve) => {
      this.currentChoices = choices;
      this.isProcessing = false;

      // 清空并隐藏
      this.buttons.forEach(btn => {
        btn.textContent = '';
        btn.classList.add('hidden');
      });

      // 显示有效的选择（最多3个）
      const validChoices = choices.filter(c => !c.condition || game.checkCondition(c.condition));

      validChoices.forEach((choice, index) => {
        if (index < 3) {
          this.buttons[index].textContent = choice.text;
          this.buttons[index].classList.remove('hidden');
          this.buttons[index].dataset.choiceIndex = choices.indexOf(choice);

          // 动画效果
          setTimeout(() => {
            this.buttons[index].classList.add('slide-up');
          }, index * 100);
        }
      });

      this.container.classList.remove('hidden');

      // 如果没有选择，自动继续
      if (validChoices.length === 0) {
        setTimeout(() => resolve(), 500);
      }
    });
  }

  // 隐藏选择
  hideChoices() {
    this.container.classList.add('hidden');
    this.currentChoices = null;
  }

  // 选择处理
  async selectChoice(index) {
    if (this.isProcessing || !this.currentChoices) return;

    this.isProcessing = true;
    audio.playSFX('choice');

    // 获取实际的选择（考虑条件过滤）
    const validChoices = this.currentChoices.filter(c => !c.condition || game.checkCondition(c.condition));
    const choice = validChoices[index];

    if (!choice) {
      this.isProcessing = false;
      return;
    }

    // 记录选择
    game.recordChoice(
      sceneManager.currentScene.id,
      index,
      choice.text
    );

    // 应用效果
    if (choice.effects) {
      this.applyEffects(choice.effects);
    }

    // 更新关系
    if (choice.relationships) {
      Object.entries(choice.relationships).forEach(([char, change]) => {
        game.updateRelationship(char, change);
      });
    }

    // 添加物品
    if (choice.items) {
      choice.items.forEach(item => game.addItem(item));
    }

    // 隐藏选择按钮
    this.hideChoices();

    // 触发 History Pause（优先选择自带，其次当前场景的）——暂停决定后续跳转
    const pauseConfig = choice.historyPause ||
      (sceneManager.currentScene && sceneManager.currentScene.historyPause);

    if (pauseConfig) {
      await this.triggerHistoryPause(pauseConfig);
    } else if (choice.next) {
      // 无历史暂停，直接跳转到下一场景或执行回调
      if (typeof choice.next === 'function') {
        await choice.next();
      } else {
        sceneManager.goToScene(choice.next);
      }
    }

    // 自动保存（含选择类场景——loadScene 的尾部保存对有选择的场景不会执行）
    game.saveState();

    this.isProcessing = false;
  }

  // 应用效果
  applyEffects(effects) {
    Object.entries(effects).forEach(([varName, change]) => {
      game.updateVariable(varName, change);
    });
  }

  // 触发 History Pause
  async triggerHistoryPause(config) {
    const pauseConfig = typeof config === 'string' ? { prompt: config } : config;

    // 显示 History Pause 覆盖层
    const pauseOverlay = document.getElementById('history-pause');
    pauseOverlay.classList.remove('hidden');
    pauseOverlay.classList.add('history-pause-enter');

    // 调用 AI 生成分析
    const analysis = await this.generateAnalysis(pauseConfig);

    // 填充内容
    document.getElementById('history-experience').innerHTML = `<p>${analysis.experience}</p>`;
    document.getElementById('history-facts').innerHTML = `<p>${analysis.history}</p>`;
    document.getElementById('history-exam-points').innerHTML = `
      <div><strong>考纲对应：</strong>${analysis.examPoints.map(p => `<span class="exam-tag">${p}</span>`).join(' ')}</div>
    `;
    if (analysis.analysis) {
      document.getElementById('history-analysis').innerHTML = `<p><strong>深度剖析：</strong>${analysis.analysis}</p>`;
    }
    if (analysis.question) {
      document.getElementById('history-question').innerHTML = `<p><strong>思考问题：</strong>${analysis.question}</p>`;
    }

    // 绑定继续按钮
    const continueBtn = document.getElementById('continue-history');
    continueBtn.onclick = async () => {
      pauseOverlay.classList.add('hidden');
      pauseOverlay.classList.remove('history-pause-enter');

      // 解锁历史档案
      if (pauseConfig.historyId) {
        game.unlockHistory(pauseConfig.historyId);
      }

      // 继续游戏
      if (pauseConfig.nextScene) {
        sceneManager.goToScene(pauseConfig.nextScene);
        game.saveState(); // 跳到下一场景后立即保存
      }
    };
  }

  // 生成 History Pause 剖析内容（全静态化：读 story.json 预写文本，不调 AI）
  async generateAnalysis(config) {
    const staticAnalysis = (config && config.staticAnalysis) || {};
    const lastChoice = game.state.choices.length > 0
      ? game.state.choices[game.state.choices.length - 1].text
      : '';
    return {
      experience: (staticAnalysis.experience || '你的选择展现了你在当时处境下的思考和判断。')
        .replace(/\{choice\}/g, lastChoice || '你的选择'),
      history: staticAnalysis.history || '这是菲律宾历史上一个重要的转折点。',
      examPoints: staticAnalysis.examPoints || (config && config.examPoints) || ['2.4.2'],
      analysis: staticAnalysis.analysis || '',
      question: staticAnalysis.question || ''
    };
  }
}

// 全局选择实例
const choices = new ChoiceSystem();
