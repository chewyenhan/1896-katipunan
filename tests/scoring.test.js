const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ScoringSystem = require('../js/scoring.js');

function loadStory() {
  const context = {};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('data/story.json', 'utf8') + ';this.loaded=storyData', context);
  return context.loaded;
}
const storyData = loadStory();
const sceneIds = ['prologue_01', 'chapter1_01', 'chapter1_02', 'chapter2_01', 'chapter3_01', 'chapter5_02'];
function records(indexes) {
  return indexes.map((choice, i) => {
    const selected = storyData.scenes.find(s => s.id === sceneIds[i]).choices[choice];
    return { scene: sceneIds[i], choice, text: selected.text, timestamp: i };
  });
}

test('all 17 choices have valid scoring data', () => {
  const choices = storyData.scenes.flatMap(s => s.choices || []);
  const keys = ['historicalJudgment', 'revolutionaryWill', 'teamResponsibility'];
  const traits = new Set(Object.keys(ScoringSystem.LABELS));
  assert.equal(choices.length, 17);
  for (const choice of choices) {
    assert.deepEqual(Object.keys(choice.scores).sort(), keys.slice().sort());
    Object.values(choice.scores).forEach(v => assert.ok(v >= 0 && v <= 100));
    Object.entries(choice.endingTraits).forEach(([k, v]) => {
      assert.ok(traits.has(k)); assert.ok(Number.isInteger(v) && v > 0);
    });
  }
});

test('uses text before stale old-save index', () => {
  const found = ScoringSystem.resolveChoice(
    { scene: 'prologue_01', choice: 0, text: '去市场打听消息' }, storyData
  );
  assert.equal(found.text, '去市场打听消息');
});

test('calculates approved grades and calibrated routes', () => {
  assert.equal(ScoringSystem.computeReport(records([0, 2, 0, 0, 1, 1]), storyData).totalScore, 90);
  assert.equal(ScoringSystem.computeReport(records([0, 0, 0, 0, 0, 2]), storyData).grade.grade, 'A');
  assert.equal(ScoringSystem.getGrade(90).grade, 'S');
  assert.equal(ScoringSystem.getGrade(80).grade, 'A');
  assert.equal(ScoringSystem.getGrade(70).grade, 'B');
  assert.equal(ScoringSystem.getGrade(60).grade, 'C');
  assert.equal(ScoringSystem.getGrade(59.9).grade, 'D');
});

test('rejects a completely unrecognizedized save', () => {
  const oldWarn = console.warn;
  console.warn = () => {};
  const report = ScoringSystem.computeReport([{ scene: 'missing', choice: 0, text: 'missing' }], storyData);
  console.warn = oldWarn;
  assert.equal(report.complete, false);
  assert.equal(report.recognizedChoices, 0);
  assert.equal(report.totalScore, null);
});

test('all 486 routes are stable and all six endings are reachable', () => {
  const endings = new Set();
  for (let a=0; a<3; a++) for (let b=0; b<3; b++) for (let c=0; c<3; c++)
  for (let d=0; d<3; d++) for (let e=0; e<2; e++) for (let f=0; f<3; f++) {
    const route = records([a,b,c,d,e,f]);
    const first = ScoringSystem.computeReport(route, storyData);
    const second = ScoringSystem.computeReport(route, storyData);
    assert.equal(first.recognizedChoices, 6);
    assert.ok(first.totalScore >= 0 && first.totalScore <= 100);
    assert.equal(second.totalScore, first.totalScore);
    assert.equal(second.personalityKey, first.personalityKey);
    endings.add(first.personalityKey);
  }
  assert.deepEqual([...endings].sort(), Object.keys(ScoringSystem.LABELS).sort());
});
