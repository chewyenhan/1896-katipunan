// 三维教学评分与结局人格计算（纯函数，兼容浏览器及 Node 测试）
const ScoringSystem = (() => {
  const DIMENSIONS = ['historicalJudgment', 'revolutionaryWill', 'teamResponsibility'];
  const WEIGHTS = { historicalJudgment: 0.40, revolutionaryWill: 0.35, teamResponsibility: 0.25 };
  const LABELS = {
    courage: '勇敢的战士',
    loyalty: '忠诚的同志',
    politicalSense: '精明的政治家',
    riskTaking: '冒险的革命者',
    compassion: '仁慈的理想主义者',
    leadership: '天生的领袖'
  };
  const TIE_ORDER = ['leadership', 'politicalSense', 'loyalty', 'compassion', 'courage', 'riskTaking'];

  function clamp(value) {
    return Math.max(0, Math.min(100, value));
  }

  function resolveChoice(record, story) {
    const scene = story && story.scenes && story.scenes.find(item => item.id === record.scene);
    if (!scene || !Array.isArray(scene.choices)) return null;
    return scene.choices.find(choice => choice.text === record.text) || scene.choices[record.choice] || null;
  }

  function getGrade(score) {
    if (score >= 90) return { grade: 'S', prefix: '卓越的', cls: 'grade-s' };
    if (score >= 80) return { grade: 'A', prefix: '成熟的', cls: 'grade-a' };
    if (score >= 70) return { grade: 'B', prefix: '可靠的', cls: 'grade-b' };
    if (score >= 60) return { grade: 'C', prefix: '成长中的', cls: 'grade-c' };
    return { grade: 'D', prefix: '尚待觉醒的', cls: 'grade-d' };
  }

  function computeReport(records, story) {
    const sums = Object.fromEntries(DIMENSIONS.map(key => [key, 0]));
    const traits = Object.fromEntries(Object.keys(LABELS).map(key => [key, 0]));
    const lastAwarded = Object.fromEntries(Object.keys(LABELS).map(key => [key, -1]));
    let recognizedChoices = 0;

    (records || []).forEach((record, position) => {
      const choice = resolveChoice(record, story);
      if (!choice || !choice.scores) {
        console.warn('评分系统忽略无法识别的选择：', record);
        return;
      }
      DIMENSIONS.forEach(key => { sums[key] += Number(choice.scores[key]) || 0; });
      Object.entries(choice.endingTraits || {}).forEach(([key, value]) => {
        if (!(key in traits)) return;
        traits[key] += Number(value) || 0;
        lastAwarded[key] = position;
      });
      recognizedChoices++;
    });

    if (!recognizedChoices) {
      return {
        complete: false,
        recognizedChoices: 0,
        dimensions: Object.fromEntries(DIMENSIONS.map(key => [key, 0])),
        totalScore: null,
        grade: null,
        personalityKey: 'courage',
        personalityLabel: LABELS.courage
      };
    }

    const dimensions = Object.fromEntries(
      DIMENSIONS.map(key => [key, Math.round(clamp(sums[key] / recognizedChoices))])
    );
    const rawTotal = DIMENSIONS.reduce(
      (total, key) => total + (sums[key] / recognizedChoices) * WEIGHTS[key], 0
    );
    const totalScore = Math.round(clamp(rawTotal));
    const personalityKey = Object.keys(LABELS).sort((a, b) =>
      traits[b] - traits[a] ||
      lastAwarded[b] - lastAwarded[a] ||
      TIE_ORDER.indexOf(a) - TIE_ORDER.indexOf(b)
    )[0];

    return {
      complete: true,
      recognizedChoices,
      dimensions,
      totalScore,
      grade: getGrade(totalScore),
      personalityKey,
      personalityLabel: LABELS[personalityKey],
      traits
    };
  }

  return { computeReport, resolveChoice, getGrade, LABELS };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = ScoringSystem;
