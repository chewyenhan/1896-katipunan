# 1896: Revolution of Choice — 选择与革命

菲律宾独立运动沉浸教学游戏

---

## 🎮 游戏简介

一款基于 HTML5 的历史沉浸教学游戏，让玩家以普通菲律宾青年身份，亲历 1892–1946 菲律宾革命的重要历史事件。

**核心设计理念：**
- 体验优先：玩家成为历史中的人物，做出自己的决定
- 选择有意义：每个选择影响变量，但不改变历史结局
- 历史锚定：关键事件后触发「History Pause」回归真实历史
- 考点对齐：所有内容对应初中统考历史考纲 2.4.2 节

---

## 📚 对照考纲

| 章节 | 考纲编号 | 考纲内容 |
|------|----------|----------|
| 序章 | 2.4.2.1 | 东南亚沦为殖民地 |
| 第 1 章 | 2.4.2.2 | 卡地普南武装斗争 |
| 第 2 章 | 2.4.2.2 | 卡地普南武装斗争爆发 |
| 第 3-6 章 | 2.4.2.3 | 印、菲、缅的独立经过 |
| 第 7 章+终章 | 2.4.2.4 | 军人独裁的菲律宾 |

---

## 🛠️ 技术栈

- **前端**: 单 HTML 文件，Vanilla JS + CSS，零依赖
- **数据**: JSON 文件驱动（story.json, characters.json, timeline.json）
- **AI**: Cloudflare Worker 代理 Gemini API
- **存储**: LocalStorage（进度保存）
- **TTS**: 浏览器内置 SpeechSynthesis API

---

## 📁 文件结构

```
1896 Katipunan/
│
├── index.html              ← 游戏入口
├── test.html               ← 测试页面（含调试面板）
├── README.md
│
├── css/
│   ├── style.css           ← 主样式（sepia 历史色调）
│   ├── ui.css              ← UI 组件
│   └── animation.css       ← 动画效果
│
├── js/
│   ├── game.js             ← 游戏主循环
│   ├── state.js            ← 状态管理
│   ├── dialogue.js         ← 对话系统（含打字机效果）
│   ├── choice.js           ← 选择系统
│   ├── sceneManager.js     ← 场景管理
│   ├── audio.js            ← 音频管理
│   ├── tts.js              ← TTS 语音系统
│   ├── save.js             ← 存档系统
│   ├── ui.js               ← UI 控制
│   └── utils.js            ← 工具函数
│
├── data/
│   ├── story.json          ← 全部剧情数据（10 场景）
│   ├── characters.json     ← 人物设定（6 人物 + 历史档案）
│   ├── timeline.json       ← 历史时间线（14 事件）
│   ├── glossary.json       ← 历史词汇表（10 词条）
│   ├── variables.json      ← 变量配置（9 变量 + 关系 + 物品）
│   └── settings.json       ← 游戏设置
│
├── assets/
│   ├── backgrounds/        ← 9 张历史背景图（17MB）
│   ├── characters/         ← 5 张人物立绘（9.8MB）
│   │   ├── bonifacio.png   ← 博尼法西奥
│   │   ├── aguinaldo.png   ← 阿奎纳多
│   │   ├── rizal.png       ← 黎刹
│   │   ├── player_male.png ← 男性玩家角色
│   │   └── player_female.png ← 女性玩家角色
│   └── audio/
│       └── bgm/            ← 背景音乐（待添加）
│
├── worker.js               ← Cloudflare Worker（AI 分析）
│
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-08-21-1896-revolution-design.md
```

---

## 🎯 游戏特性

### 多视角轮换
每章切换玩家角色，从不同角度理解革命：
- 序章：普通中学生
- 第 1 章：印刷工人
- 第 2 章：女学生（Katipunan 成员）
- 第 3 章：农村战士
- ...

### 变量系统（9 个核心变量）
- Hope（希望）、Fear（恐惧）、Trust（信任）
- Support（支持度）、Leadership（领导力）
- Reputation（名声）、Food（粮食）、Weapon（武器）、Alert（警戒）

### 关系系统
- Bonifacio、Jacinto、Aguinaldo、Mother、Friend
- 关系评分影响 NPC 对白和剧情

### AI 分析
- History Pause 触发 AI 生成个性化分析
- 对照考纲标注知识点
- 统考视角深度剖析

### TTS 语音
- 浏览器内置 SpeechSynthesis API
- 中文语音自动朗读
- 设置面板可开关、调音量

---

## 🚀 运行方式

### 本地运行
```bash
# 直接打开 index.html
start "D:\AIgames\1896 Katipunan\index.html"
```

或使用测试页面：
```bash
start "D:\AIgames\1896 Katipunan\test.html"
```

### 部署到 GitHub Pages
```bash
cd "D:\AIgames\1896 Katipunan"
git init
git add .
git commit -m "feat: initial release"
git push origin main
```

### Worker 部署
```bash
cd worker.js 所在目录
npx wrangler deploy
```

---

## 📊 素材完成情况

| 类型 | 数量 | 状态 |
|------|------|------|
| 背景图 | 9 张 | ✅ 完成（17MB） |
| 人物立绘 | 5 张 | ✅ 完成（9.8MB） |
| 背景音乐 | 3 首 | ⏳ 待添加（网络限制） |
| 剧情场景 | 10 个 | ✅ 完成（序章 + 1-7 章 + 结局） |
| 历史档案 | 3 个 | ✅ 完成 |
| 时间线事件 | 14 个 | ✅ 完成 |
| 词汇表 | 10 个 | ✅ 完成 |

---

## 🔧 后续开发

1. **添加 BGM** — 手动下载音频文件放入 `assets/audio/bgm/`
2. **完善剧情** — 第 3-7 章详细内容待填充
3. **生成母亲立绘** — 之前生成失败，可重试
4. **添加 SFX** — 点击/选择音效
5. **移动端适配** — 优化响应式设计
6. **多语言** — 添加英文版本

---

## 📖 参考资料

- 初中统考历史考纲：`D:\AIgames\dongzonghistory\exam outline\初中统考历史考纲.pdf`
- 设计文档：`docs/superpowers/specs/2026-08-21-1896-revolution-design.md`
- 原始项目文档：`01_ProjectBrief.md` 等

---

## 📝 已知问题

| 问题 | 状态 | 解决方案 |
|------|------|----------|
| BGM 文件过小（355B） | ⚠️ 待修复 | 手动下载真实音频 |
| mother.png 未生成 | ⚠️ 待补充 | 重试生成或手动添加 |
| 部分场景无选择 | ℹ️ 预期行为 | 剧情推进用 History Pause |

---

## 许可证

© 2026 华联中学 · Hua Lian High School · CHEW YEN HAN 制作
# 三维评分与结局

最终成绩由历史判断（40%）、革命意志（35%）和团队责任（25%）组成。评级为 S 90–100、A 80–89、B 70–79、C 60–69、D 0–59。成绩评价综合表现，六种片尾动画则描述选择形成的人格倾向，两者不作高低绑定。旧存档会按场景和选择文字重新计算，无须清除。

完整标准见 [评分与结局设计](docs/superpowers/specs/2026-09-12-scoring-and-endings-design.md)。
