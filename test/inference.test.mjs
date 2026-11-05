// Every test checked against R 4.x (shapiro.test, t.test, wilcox.test, aov, oneway.test, kruskal.test,
// TukeyHSD, chisq.test(correct = FALSE), fisher.test, cor.test, lm, glm). Games-Howell and Dunn
// (Bonferroni) were computed in R from their formulas with ptukey / pnorm.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as I from '../src/utils/inference.js';

const a = [5.1, 4.9, 6.2, 5.8, 6.0, 5.5, 5.3, 6.1, 4.8, 5.9, 6.4, 5.0];
const b = [4.2, 4.8, 5.1, 4.4, 4.0, 4.9, 5.3, 4.6, 4.1, 4.7];
const c = [6.5, 7.1, 6.8, 7.4, 6.9, 7.7, 6.2, 7.0];
const near = (got, want, rel = 1e-4) =>
  assert.ok(Math.abs(got - want) <= rel * Math.max(Math.abs(want), 1e-12) + 1e-12, `got ${got}, want ${want}`);

test('Shapiro-Wilk', () => {
  let r = I.shapiroWilk(a); near(r.W, 0.9317666832); near(r.p, 0.3992147322, 1e-3);
  r = I.shapiroWilk(Array.from({ length: 40 }, (_, i) => Math.exp(i / 8))); near(r.W, 0.7647552876); near(r.p, 1.348600446e-06, 1e-2);
  r = I.shapiroWilk([1, 2, 4, 7, 8]); near(r.W, 0.922879084); near(r.p, 0.5486807186, 1e-3);
});

test('two-group tests', () => {
  let r = I.tTest(a, b); near(r.t, 4.516869807); assert.equal(r.df, 20); near(r.p, 0.0002103412664);
  r = I.welchTTest(a, b); near(r.t, 4.621970287); near(r.df, 19.94201326); near(r.p, 0.000165843291);
  r = I.mannWhitneyU(a, b); assert.equal(r.U, 110); near(r.p, 0.001084537409); // ties: normal approx
  r = I.mannWhitneyU([1.1, 2.3, 3.5, 4.2, 9.9], [2.9, 5.1, 6.3, 7.7, 8.2, 8.8]); assert.equal(r.U, 8); assert.ok(r.exact); near(r.p, 0.2467532468);
});

test('k-group tests and post-hoc', () => {
  near(I.oneWayAnova([a, b, c]).F, 49.50112855); near(I.oneWayAnova([a, b, c]).p, 9.296156602e-10, 1e-3);
  const w = I.welchAnova([a, b, c]); near(w.F, 56.10400162); near(w.df2, 17.07175134); near(w.p, 3.124715399e-08, 1e-3);
  const k = I.kruskalWallis([a, b, c]); near(k.H, 22.55802246); near(k.p, 1.263536122e-05, 1e-3);
  I.tukeyHSD([a, b, c]).forEach((r, i) => near(r.p, [0.0002683193098, 5.639785112e-06, 4.757954031e-10][i], 2e-2));
  I.gamesHowell([a, b, c]).forEach((r, i) => near(r.p, [0.0004667001108, 5.391543638e-05, 7.561829318e-08][i], 2e-2));
  I.dunn([a, b, c]).forEach((r, i) => near(r.p, [0.04094350738, 0.02639746374, 6.187118964e-06][i]));
});

test('paired tests', () => {
  const r = I.pairedTTest(a.slice(0, 10), b); near(r.t, 4.813941949); near(r.p, 0.0009549938233);
  let w = I.wilcoxonSignedRank(a.slice(0, 10), b); assert.equal(w.V, 45); near(w.p, 0.009151688853);
  w = I.wilcoxonSignedRank([10.2, 11.5, 9.8, 12.1, 10.9, 11.7, 10.4, 12.6], [9.1, 11.9, 8.7, 10.2, 10.3, 10.0, 9.5, 11.1]);
  assert.equal(w.V, 35); assert.ok(w.exact); near(w.p, 0.015625);
});

test('categorical tests', () => {
  const r = I.chiSquare([[12, 9, 3], [5, 7, 14]]); near(r.x2, 10.18629808); near(r.p, 0.006138658547);
  near(I.fisherExact([[8, 1], [2, 5]]).p, 0.03496503497);
});

test('correlation', () => {
  const x = Array.from({ length: 12 }, (_, i) => i + 1);
  const p = I.pearson(a, x); near(p.r, 0.1228716386); near(p.p, 0.7036253365);
  near(I.spearman(a, x).r, 0.1048951049);
});

test('regression', () => {
  const x = Array.from({ length: 12 }, (_, i) => i + 1), x2 = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8];
  const lm = I.linearRegression(x.map((v, i) => [v, x2[i]]), a);
  [5.463604488, 0.01938990182, -0.001455119215].forEach((v, j) => near(lm.coef[j].b, v));
  [0.4116624291, 0.05859496475, 0.08335295731].forEach((v, j) => near(lm.coef[j].se, v));
  near(lm.coef[1].p, 0.7482835301); near(lm.r2, 0.01513078922, 1e-3);
  const g = I.logisticRegression(x2.map(v => [v]), [0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1]);
  near(g.coef[0].b, -3.952999965); near(g.coef[1].b, 1.109894823); near(g.coef[1].se, 0.6213161515); near(g.coef[1].p, 0.07404085683);
});

test('outliers', () => {
  assert.deepEqual(I.outlierIndexes([1, 2, 2, 3, 3, 3, 4, 4, 50]), [8]);
  assert.deepEqual(I.outlierIndexes([...Array(30).fill(10), 11, 9, 100], 'z'), [32]);
});
