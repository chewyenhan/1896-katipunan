# Scoring and Endings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the impossible-to-maximize score with a three-dimensional classroom score and make all six ending animations reachable through deterministic personality points.

**Architecture:** Put approved educational scores and personality increments beside each choice in `story.json`. A pure `ScoringSystem` resolves old save records and returns one report consumed by the results screen, animation selector, and leaderboard. Existing saves and the Worker API remain unchanged.

**Tech Stack:** Vanilla JavaScript, browser globals, Node.js built-in `node:test` and `assert`, HTML/CSS.

## Global Constraints

- Weights: historical judgment 40%, revolutionary will 35%, team responsibility 25%.
- Grades: S 90–100, A 80–89, B 70–79, C 60–69, D 0–59.
- Score and ending personality are independent; every grade receives one of the six existing animations.
- Personality starts with six zeroes and uses only explicit choice increments.
- Resolve old saves by scene ID plus choice text first, recorded index second.
- Skip unrecognized choices with a warning; zero recognized choices are not submitted.
- Do not delete saves, leaderboard records, videos, or fallback frames.
- Add no dependency or build step.

---

### Task 1: Add the approved rubric to story data

**Files:**
- Modify: `data/story.json`
- Create: `tests/scoring-data.test.js`

**Interfaces:**
- Produces `choice.scores` with `historicalJudgment`, `revolutionaryWill`, and `teamResponsibility`.
- Produces `choice.endingTraits` using only `courage`, `loyalty`, `politicalSense`, `riskTaking`, `compassion`, and `leadership`.

- [ ] **Step 1: Write the failing data-contract test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function loadStory() {
  const context = {};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('data/story.json', 'utf8') + ';this.loaded=storyData', context);
  return context.loaded;
}
test('all 17 choices have bounded dimensions and valid traits', () => {
  const choices = loadStory().scenes.flatMap(s => s.choices || []);
  const dimensions = ['historicalJudgment', 'revolutionaryWill', 'teamResponsibility'];
  const traits = new Set(['courage', 'loyalty', 'politicalSense', 'riskTaking', 'compassion', 'leadership']);
  assert.equal(choices.length, 17);
  for (const choice of choices) {
    assert.deepEqual(Object.keys(choice.scores).sort(), dimensions.slice().sort());
    Object.values(choice.scores).forEach(v => assert.ok(v >= 0 && v <= 100));
    Object.entries(choice.endingTraits).forEach(([k, v]) => {
      assert.ok(traits.has(k)); assert.ok(Number.isInteger(v) && v > 0);
    });
  }
});
```

- [ ] **Step 2: Confirm the test fails**

Run `node --test tests/scoring-data.test.js`; expect failure because `scores` is absent.

- [ ] **Step 3: Encode all 17 approved rows**

Copy the exact dimensions and increments from `docs/superpowers/specs/2026-09-12-scoring-and-endings-design.md`. Keep legacy `score` until UI integration is complete. Shape:

```js
"scores": { "historicalJudgment": 95, "revolutionaryWill": 75, "teamResponsibility": 70 },
"endingTraits": { "politicalSense": 2, "compassion": 1 }
```

- [ ] **Step 4: Add strategic-choice assertions**

Assert “撤退保存实力” equals `{95,75,100}` and “心存疑虑，暗中保留武装” equals `{100,85,95}` using their three named keys.

- [ ] **Step 5: Run and commit**

Run `node --test tests/scoring-data.test.js`; expect PASS 2/2. Commit `data/story.json` and the test as `feat: add multidimensional choice rubric`.

### Task 2: Implement the pure scoring engine

**Files:**
- Create: `js/scoring.js`
- Create: `tests/scoring.test.js`

**Interfaces:**
- `ScoringSystem.resolveChoice(record, storyData): Choice|null`
- `ScoringSystem.getGrade(score): { grade, prefix, cls }`
- `ScoringSystem.computeReport(records, storyData): { complete, recognizedChoices, dimensions, totalScore, grade, personalityKey, personalityLabel }`

- [ ] **Step 1: Write failing calculation tests**

Test that the treaty choice `{100,85,95}` produces 93.5 before final rounding and total 94; boundaries 90/80/70/60 map to S/A/B/C and 59.9 maps to D.

- [ ] **Step 2: Write failing compatibility tests**

Use `{scene:'prologue_01', choice:0, text:'去市场打听消息'}` and assert text wins over the stale index. Assert an unknown scene returns `complete:false`, `recognizedChoices:0`, and `totalScore:null`.

- [ ] **Step 3: Confirm the tests fail**

Run `node --test tests/scoring-data.test.js tests/scoring.test.js`; expect data tests to pass and engine tests to fail because `js/scoring.js` is missing.

- [ ] **Step 4: Implement `js/scoring.js`**

Use these constants:

```js
const WEIGHTS = { historicalJudgment: 0.40, revolutionaryWill: 0.35, teamResponsibility: 0.25 };
const LABELS = { courage:'勇敢的战士', loyalty:'忠诚的同志', politicalSense:'精明的政治家', riskTaking:'冒险的革命者', compassion:'仁慈的理想主义者', leadership:'天生的领袖' };
const TIE_ORDER = ['leadership', 'politicalSense', 'loyalty', 'compassion', 'courage', 'riskTaking'];
```

`computeReport` must average each dimension over recognized choices, apply weights once after averaging, clamp dimensions to 0–100, and round only the displayed total. Accumulate `endingTraits`; ties use the latest awarded record position, then `TIE_ORDER`. Export as browser global and `module.exports`.

- [ ] **Step 5: Add route-calibration tests**

Balanced indices `[0,2,0,0,1,1]` across the six scored scenes must round to 90/S. Militant indices `[0,0,0,0,0,2]` must be A. Run every test twice and assert identical personality.

- [ ] **Step 6: Run and commit**

Run `node --test tests/scoring-data.test.js tests/scoring.test.js`; expect all tests to pass. Commit both new files as `feat: calculate weighted scores and ending personalities`.

### Task 3: Connect reports, animations, and leaderboard

**Files:**
- Modify: `index.html`
- Modify: `js/ui.js`
- Modify: `css/ui.css`
- Modify: `test.html`

**Interfaces:**
- Consumes `ScoringSystem.computeReport(game.state.choices, storyData)` once per results flow.
- The same report drives visible score, three bars, animation, title, and leaderboard payload.

- [ ] **Step 1: Load `js/scoring.js`**

Add `<script src="js/scoring.js"></script>` after `data/story.json` and before `js/ui.js` in both HTML files.

- [ ] **Step 2: Remove duplicate calculations**

Add `getScoringReport() { return ScoringSystem.computeReport(game.state.choices, storyData); }`. Replace `computeTotalScore`, `getGrade`, `getPersonalityType`, and ending selection from `game.getReportData()` with this report.

- [ ] **Step 3: Protect incomplete reports**

When `report.complete` is false, show `成绩资料不完整，无法计算。`, clear the leaderboard container, reveal the report overlay, and return before `submitAndLoadLeaderboard`.

- [ ] **Step 4: Render the approved result**

Display `${report.totalScore} / 100`, `${report.grade.grade}级 · ${report.grade.prefix}${report.personalityLabel}`, plus bars labeled 历史判断、革命意志、团队责任. For D, append `你的行动风格已经形成，但还需要更主动地理解局势并承担集体责任。`.

- [ ] **Step 5: Connect animation and submission**

Select `META[report.personalityKey]`. Submit `report.totalScore` and `${report.grade.prefix}${report.personalityLabel}` to the unchanged Worker endpoint.

- [ ] **Step 6: Preserve the visual theme**

In `css/ui.css`, add only responsive spacing needed by three bars and the combined title. At 320px width, bars and text must not overflow.

- [ ] **Step 7: Expand `test.html` diagnostics**

Add balanced, militant, and passive route buttons. Each prints recognized count, dimensions, total, grade, and personality key.

- [ ] **Step 8: Test and commit**

Run `node --test tests/*.test.js`. In `test.html`, verify balanced=90/S, militant=A, passive<60/D, each has a personality, and the console has no exception. Commit the four integration files as `feat: connect scoring report to endings and leaderboard`.

### Task 4: Exhaustive regression and documentation

**Files:**
- Modify: `tests/scoring.test.js`
- Modify: `README.md`

**Interfaces:**
- Verifies the final `ScoringSystem`, all 486 complete routes, old-save records, and six animation personalities.

- [ ] **Step 1: Test all 486 routes**

Generate `3×3×3×3×2×3` routes. For each, assert 6 recognized choices, score 0–100, grade in S/A/B/C/D, a known personality key, and identical output on a second run. Assert the collected personality set equals all six keys.

- [ ] **Step 2: Test exact old-save shape**

Use six records containing only `scene`, `choice`, `text`, and `timestamp`. Assert all six resolve. Remove timestamps and assert route order still gives deterministic output.

- [ ] **Step 3: Run automated verification**

Run `node --test tests/*.test.js`; expect every data, calculation, compatibility, calibration, and 486-route test to pass.

- [ ] **Step 4: Perform browser regression**

Load a disposable pre-feature save, finish the story, and verify one report, one leaderboard submission, and an MP4 or matching fallback frame. Do not delete any user save.

- [ ] **Step 5: Update documentation and commit**

Document weights, grade boundaries, score/personality separation, and old-save compatibility in `README.md`, linking the design spec. Commit test and README changes as `test: verify scoring calibration and ending coverage`.

