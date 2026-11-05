// The layer that turns rows + config into results: test choice, post-hoc, exclusions, config loading.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { levene } from '../src/utils/inference.js';
import * as A from '../src/utils/analyses.js';

const a = [5.1, 4.9, 6.2, 5.8, 6.0, 5.5, 5.3, 6.1, 4.8, 5.9, 6.4, 5.0];
const b = [4.2, 4.8, 5.1, 4.4, 4.0, 4.9, 5.3, 4.6, 4.1, 4.7];
const c = [6.5, 7.1, 6.8, 7.4, 6.9, 7.7, 6.2, 7.0];
const rows = [...a.map(y => ({ y, g: 'A' })), ...b.map(y => ({ y, g: 'B' })), ...c.map(y => ({ y, g: 'C' }))];
const types = { y: 'ratio', g: 'nominal' };

test('Levene matches R (aov on |x - group mean|)', () => {
  const r = levene([a, b, c]);
  assert.ok(Math.abs(r.F - 1.055374593) < 1e-6 && Math.abs(r.p - 0.3619846486) < 1e-6);
});

test('three normal groups with equal variances: ANOVA, then Tukey', () => {
  const r = A.compareGroups(rows, 'y', 'g');
  assert.equal(r.result.test, 'oneWayAnova');
  assert.equal(r.posthoc.method, 'tukey');
  assert.deepEqual(r.posthoc.rows.map(p => `${p.a}-${p.b}`), ['A-B', 'A-C', 'B-C']);
});

test('excluding outliers blanks them only in the chosen column', () => {
  const data = [...rows, { y: 99, g: 'A' }];
  const cfg = { ...A.emptyConfig(), exclusions: ['y'] };
  const clean = A.applyExclusions(data, types, cfg);
  assert.equal(clean.at(-1).y, null);
  assert.equal(clean.at(-1).g, 'A');
  assert.equal(data.at(-1).y, 99); // input untouched
});

test('sparse 2x2 table gets Fisher', () => {
  const d = [...Array(8).fill({ s: 'x', t: 'p' }), { s: 'x', t: 'q' }, ...Array(2).fill({ s: 'y', t: 'p' }), ...Array(5).fill({ s: 'y', t: 'q' })];
  const r = A.crosstab(d, 's', 't');
  assert.deepEqual(r.table, [[8, 1], [2, 5]]);
  assert.ok(Math.abs(r.fisher.p - 0.03496503497) < 1e-8);
});

test('a loaded config keeps only columns that exist with the right type', () => {
  const cfg = A.sanitizeConfig({ groupingVariable: 'y', pairs: [{ a: 'y', b: 'nope' }], corr: { vars: ['y', 'g'] }, regression: { y: 'y', xs: ['y', 'g'] } }, types);
  assert.equal(cfg.groupingVariable, '');
  assert.deepEqual(cfg.pairs, []);
  assert.deepEqual(cfg.corr.vars, ['y']);
  assert.deepEqual(cfg.regression.xs, []);
  assert.deepEqual(A.sanitizeConfig('garbage', types), A.emptyConfig());
});
