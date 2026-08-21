// 游戏状态管理

class GameState {
  constructor() {
    this.defaultState = {
      // 基础信息
      playerName: '',
      currentScene: 'prologue_01',
      currentChapter: 0,

      // 核心变量
      variables: {
        hope: 50,      // 希望
        fear: 30,      // 恐惧
        trust: 40,     // 信任
        support: 50,   // 革命支持度
        leadership: 30,// 领导力
        reputation: 40,// 名声
        food: 50,      // 粮食
        weapon: 10,    // 武器
        alert: 20      // 西班牙警戒等级
      },

      // 人物关系 (0-100)
      relationships: {
        bonifacio: 30,
        jacinto: 20,
        aguinaldo: 10,
        mother: 50,
        friend: 40
      },

      // 物品栏
      inventory: [],

      // 历史记录
      choices: [],
      unlockedHistory: [],

      // 设置
      settings: {
        ttsEnabled: true,
        musicEnabled: true,
        volume: 50,
        fastForward: false
      },

      // 进度
      chapterProgress: {},
      gameStartTime: Date.now(),
      totalPlayTime: 0
    };

    this.state = this.loadState() || this.defaultState;
  }

  loadState() {
    try {
      const saved = localStorage.getItem('1896_revolution_save');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error('加载存档失败:', e);
      return null;
    }
  }

  saveState() {
    try {
      localStorage.setItem('1896_revolution_save', JSON.stringify(this.state));
      return true;
    } catch (e) {
      console.error('保存存档失败:', e);
      return false;
    }
  }

  resetState() {
    this.state = Utils.deepClone(this.defaultState);
    this.saveState();
  }

  // 更新变量
  updateVariable(name, change) {
    if (this.state.variables.hasOwnProperty(name)) {
      const oldVal = this.state.variables[name];
      this.state.variables[name] = Math.max(0, Math.min(100, oldVal + change));

      // 显示变化提示
      if (change !== 0) {
        Utils.showVariableChange(name, change);
      }

      // 特殊处理
      this.handleVariableEffects(name, this.state.variables[name]);

      return true;
    }
    return false;
  }

  // 变量变化效果
  handleVariableEffects(name, value) {
    switch(name) {
      case 'alert':
        // 警戒高会降低某些选项可用性
        break;
      case 'food':
        // 粮食低会触发特殊对话
        if (value <= 10) {
          this.triggerEvent('starvation');
        }
        break;
      case 'weapon':
        // 武器影响战斗场景
        break;
    }
  }

  // 更新关系
  updateRelationship(character, change) {
    if (this.state.relationships.hasOwnProperty(character)) {
      this.state.relationships[character] = Math.max(0, Math.min(100,
        this.state.relationships[character] + change));
    }
  }

  // 添加物品
  addItem(itemId) {
    if (!this.state.inventory.includes(itemId)) {
      this.state.inventory.push(itemId);
    }
  }

  // 移除物品
  removeItem(itemId) {
    const index = this.state.inventory.indexOf(itemId);
    if (index > -1) {
      this.state.inventory.splice(index, 1);
    }
  }

  // 记录选择
  recordChoice(sceneId, choiceIndex, choiceText) {
    this.state.choices.push({
      scene: sceneId,
      choice: choiceIndex,
      text: choiceText,
      timestamp: Date.now()
    });
  }

  // 解锁历史档案
  unlockHistory(historyId) {
    if (!this.state.unlockedHistory.includes(historyId)) {
      this.state.unlockedHistory.push(historyId);
    }
  }

  // 获取统计数据用于革命报告
  getReportData() {
    return {
      courage: Math.floor((this.state.variables.support + this.state.variables.trust) / 2),
      loyalty: this.state.relationships.bonifacio,
      politicalSense: Math.floor(this.state.variables.leadership + this.state.variables.reputation / 2),
      riskTaking: 100 - this.state.variables.fear,
      compassion: this.state.relationships.mother,
      leadership: this.state.variables.leadership
    };
  }

  // 获取当前章节
  getCurrentChapter() {
    const scene = storyData.scenes.find(s => s.id === this.state.currentScene);
    return scene ? scene.chapter : 0;
  }

  // 检查条件
  checkCondition(condition) {
    const { variable, operator, value } = condition;
    const current = this.state.variables[variable] || 0;

    switch(operator) {
      case '>': return current > value;
      case '<': return current < value;
      case '>=': return current >= value;
      case '<=': return current <= value;
      case '=': return current === value;
      default: return current >= value;
    }
  }
}

// 全局状态实例
const game = new GameState();
