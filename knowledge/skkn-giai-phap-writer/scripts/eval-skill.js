/**
 * Evaluation script for SKKN Knowledge Skill
 * Tests core structure and presence of essential reference files.
 */
const fs = require('fs');
const path = require('path');

function runSkillEvaluation() {
  const baseDir = path.resolve(__dirname, '..');
  const skillMdPath = path.join(baseDir, 'SKILL.md');
  
  if (!fs.existsSync(skillMdPath)) {
    console.error('FAIL: SKILL.md not found at ' + skillMdPath);
    process.exit(1);
  }

  const requiredReferences = [
    'knowledge-math.md',
    'knowledge-assessment-evidence.md',
    'moet-priorities-2026-2027.md',
    'skkn-structure-standard.md'
  ];

  for (const ref of requiredReferences) {
    const refPath = path.join(baseDir, 'references', ref);
    if (!fs.existsSync(refPath)) {
      console.error(`FAIL: Missing reference file ${ref}`);
      process.exit(1);
    }
  }

  console.log('PASS: SKKN Knowledge Pack structure validated successfully.');
}

if (require.main === module) {
  runSkillEvaluation();
}

module.exports = { runSkillEvaluation };
