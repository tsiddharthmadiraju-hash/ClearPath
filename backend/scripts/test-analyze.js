/**
 * Offline smoke test for the analysis pipeline (no server, no API key).
 * Run with: npm run test:analyze
 */
import assert from 'node:assert';
import { analyzeDocument } from '../src/analyze.js';
import { validateAnalysis } from '../src/validate.js';

let passed = 0;
function check(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

const evictionText =
  'You have 5 days to cure or vacate. Unlawful detainer. Landlord will file a writ of possession.';

const { raw } = await analyzeDocument({ text: evictionText });
const { analysis } = validateAnalysis(raw);

console.log('ClearPath analysis pipeline (mock mode):');

check('detects an eviction notice', () => {
  assert.match(analysis.document_type, /evic/i);
});
check('returns high confidence for a clear document', () => {
  assert.strictEqual(analysis.confidence, 'high');
});
check('produces an ordered action checklist', () => {
  assert.ok(analysis.action_checklist.length >= 1);
  assert.ok(analysis.action_checklist.every((s) => s.action && s.urgency));
});
check('includes 211 as a resource', () => {
  assert.ok(analysis.resources.some((r) => /\b211\b/.test(r.name)));
});

// Garbage input must degrade to low confidence with 211 first.
const { raw: rawLow } = await analyzeDocument({ text: 'asdf' });
const { analysis: low } = validateAnalysis(rawLow);
check('forces low confidence on unreadable input', () => {
  assert.strictEqual(low.confidence, 'low');
});
check('puts 211 first on low-confidence results', () => {
  assert.match(low.resources[0].name, /\b211\b/);
});

// Validator should repair a malformed model response rather than crash.
const { analysis: repaired, issues } = validateAnalysis({ document_type: 'X' });
check('repairs a malformed response and flags issues', () => {
  assert.strictEqual(repaired.confidence, 'low');
  assert.ok(issues.length > 0);
  assert.ok(repaired.disclaimer.includes('211'));
});

console.log(`\n${passed} checks passed.`);
