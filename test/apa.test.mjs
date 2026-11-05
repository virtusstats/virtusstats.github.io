import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fmtP, stat, groupSentence } from '../src/utils/apa.js';
import { compareGroups } from '../src/utils/analyses.js';

test('APA p values: three decimals, no leading zero, < .001 floor', () => {
  assert.equal(fmtP(0.0249), 'p = .025');
  assert.equal(fmtP(0.0004), 'p < .001');
  assert.equal(fmtP(0.5), 'p = .500');
});

test('t-test statistic string', () => {
  assert.equal(stat({ test: 'indTTest', t: 2.314, df: 48, p: 0.025, d: 0.654 }), 't(48) = 2.31, p = .025, d = 0.65');
});

test('group sentence names the test, groups and effect in both languages', () => {
  const rows = [5.1, 4.9, 6.2, 5.8, 6.0, 5.5].map(y => ({ y, g: 'A' })).concat([4.2, 4.8, 5.1, 4.4, 4.0, 4.9].map(y => ({ y, g: 'B' })));
  const cmp = compareGroups(rows, 'y', 'g');
  assert.match(groupSentence(cmp, 'tr'), /^Bağımsız örneklem t-testi sonucuna göre y değişkeni g grupları arasında anlamlı farklılık göstermektedir \(A: Ort = 5\.58/);
  assert.match(groupSentence(cmp, 'en'), /t\(10\) = \d\.\d\d, p = \.\d{3}, d = \d\.\d\d; large effect\.$/);
});
