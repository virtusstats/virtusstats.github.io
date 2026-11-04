// npm test: normality direction and the test recommendation that depends on it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateStats } from '../src/utils/statsEngine.js';

// Deterministic samples: a symmetric bell shape and a strongly right-skewed one.
const bell = [];
for (let i = -30; i <= 30; i++) for (let k = 0; k < Math.round(20 * Math.exp(-(i * i) / 200)); k++) bell.push(50 + i);
const skewed = Array.from({ length: 200 }, (_, i) => Math.exp(i / 25));

const stats = (values, groups) => calculateStats(
  values.map((v, i) => ({ y: v, g: groups ? groups[i] : 'a' })),
  { y: 'ratio', g: 'nominal' },
  groups ? 'g' : '',
).find(r => r.variable === 'y');

test('normal-looking data is reported normal (p >= 0.05)', () => {
  const r = stats(bell);
  assert.ok(Number(r.pValue) >= 0.05, r.pValue);
  assert.equal(r.isNormal, 'Yes');
});

test('skewed data is reported not normal (p < 0.05)', () => {
  const r = stats(skewed);
  assert.ok(Number(r.pValue) < 0.05, r.pValue);
  assert.equal(r.isNormal, 'No');
});

test('two groups: normal data gets a t-test, skewed data Mann-Whitney', () => {
  const half = n => Array.from({ length: n }, (_, i) => (i % 2 ? 'A' : 'B'));
  assert.match(stats(bell, half(bell.length)).recommendedTest, /TTest$/);
  assert.equal(stats(skewed, half(skewed.length)).recommendedTest, 'mannWhitneyU');
});
