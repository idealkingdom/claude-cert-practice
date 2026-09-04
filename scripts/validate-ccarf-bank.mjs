import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const root = new URL('../', import.meta.url);
const bankSource = fs.readFileSync(new URL('ccarf-final-bank.js', root), 'utf8');
const appSource = fs.readFileSync(new URL('ccarf-final.js', root), 'utf8');
const bankSandbox = { window: {} };
vm.runInNewContext(bankSource, bankSandbox);

const bank = bankSandbox.window.CCARF_FINAL_BANK;
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };
const forbidden = [
  'under the stated latency and cost constraints',
  'using the current model and approved tool inventory',
  'while keeping unrelated service boundaries unchanged',
  'while retaining existing monitoring and rollback controls',
  'while preserving the current audit path',
  'without weakening the existing authorization policy',
  'while keeping the existing service boundary',
  'with the current latency target unchanged',
  'without adding another model call'
];

assert(bank.questions.length === 480, `Expected 480 bank entries, found ${bank.questions.length}.`);
assert(new Set(bank.questions.map(q => q.id)).size === bank.questions.length, 'Question IDs are not unique.');

let uniqueLongest = 0;
let uniqueShortest = 0;
for (const question of bank.questions) {
  assert(question.stem && question.stem.length > 45, `${question.id}: stem is too short.`);
  assert(question.conceptId, `${question.id}: missing decision fingerprint.`);
  assert(Array.isArray(question.options) && question.options.length === 4, `${question.id}: expected four options.`);
  assert(Number.isInteger(question.correct) && question.correct >= 0 && question.correct < 4, `${question.id}: invalid correct option.`);
  const combined = [question.stem, ...question.options.map(o => o.text)].join(' ').toLowerCase();
  for (const phrase of forbidden) assert(!combined.includes(phrase), `${question.id}: contains giveaway phrase “${phrase}”.`);
  const lengths = question.options.map(o => o.text.trim().split(/\s+/).length);
  const longest = Math.max(...lengths);
  const shortest = Math.min(...lengths);
  if (lengths[question.correct] === longest && lengths.filter(n => n === longest).length === 1) uniqueLongest++;
  if (lengths[question.correct] === shortest && lengths.filter(n => n === shortest).length === 1) uniqueShortest++;
}

const longestRate = uniqueLongest / bank.questions.length;
const shortestRate = uniqueShortest / bank.questions.length;
assert(longestRate <= 0.55, `Correct answer is uniquely longest in ${(longestRate * 100).toFixed(1)}% of items.`);
assert(shortestRate <= 0.35, `Correct answer is uniquely shortest in ${(shortestRate * 100).toFixed(1)}% of items.`);
assert(new Set(bank.questions.map(q => q.conceptId)).size >= 63, 'Decision fingerprint coverage fell below 63 patterns.');

const instrumented = appSource.replace(
  'applyTheme();landing();',
  'window.__ccarfTest={buildForm,setState:value=>{state=value},DATA,qmap};'
);
const appSandbox = {
  window: { CCARF_FINAL_BANK: bank },
  document: {
    getElementById: () => ({}),
    addEventListener: () => {},
    documentElement: { dataset: {} },
    querySelector: () => ({ content: '' }),
    body: { appendChild: () => {} }
  },
  localStorage: { getItem: () => null, setItem: () => {} },
  crypto: webcrypto,
  console,
  setInterval,
  clearInterval,
  setTimeout,
  clearTimeout,
  confirm: () => true,
  Date,
  Math,
  Uint32Array
};
vm.runInNewContext(instrumented, appSandbox);
const test = appSandbox.window.__ccarfTest;

for (const total of [30, 60]) {
  const history = [];
  for (let run = 0; run < 40; run++) {
    test.setState({ history, attempt: null });
    const form = test.buildForm(total);
    const questions = form.questionIds.map(id => test.qmap.get(id));
    const quota = total === 60 ? bank.exam.quotas60 : bank.exam.quotas30;
    assert(questions.length === total, `${total}-question form ${run}: wrong item count.`);
    assert(new Set(form.questionIds).size === total, `${total}-question form ${run}: repeated question ID.`);
    assert(new Set(questions.map(q => q.conceptId)).size === total, `${total}-question form ${run}: repeated decision fingerprint.`);
    assert(form.scenarioIds.every(id => questions.filter(q => q.scenario === id).length === 15), `${total}-question form ${run}: scenario block is not 15 items.`);
    for (const [domain, expected] of Object.entries(quota)) {
      assert(questions.filter(q => q.domain === domain).length === expected, `${total}-question form ${run}: ${domain} quota mismatch.`);
    }
    history.unshift({ id: `test-${total}-${run}`, questionIds: form.questionIds, scenarioIds: form.scenarioIds });
    history.splice(30);
  }
}

if (failures.length) {
  console.error(failures.map(message => `- ${message}`).join('\n'));
  process.exit(1);
}

console.log(`Validated ${bank.questions.length} entries, ${new Set(bank.questions.map(q => q.conceptId)).size} decision fingerprints, and 80 rotating forms.`);
console.log(`Correct option is uniquely longest in ${(longestRate * 100).toFixed(1)}% and uniquely shortest in ${(shortestRate * 100).toFixed(1)}% of bank entries.`);
