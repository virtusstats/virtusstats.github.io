// Hypothesis tests, effect sizes, post-hoc comparisons, correlation and regression.
// Pure functions on plain number arrays, checked against R in test/inference.test.mjs.
import jstat from 'jstat'; // CommonJS package: default import works in both Vite and Node (npm test)
const { jStat } = jstat;

const sum = a => a.reduce((s, v) => s + v, 0);
export const mean = a => sum(a) / a.length;
export const variance = a => { const m = mean(a); return sum(a.map(v => (v - m) ** 2)) / (a.length - 1); };
export const sd = a => Math.sqrt(variance(a));
const pT = (t, df) => 2 * (1 - jStat.studentt.cdf(Math.abs(t), df));
const pZ = z => 2 * (1 - jStat.normal.cdf(Math.abs(z), 0, 1));
const pF = (f, d1, d2) => 1 - jStat.centralF.cdf(f, d1, d2);
const pChi = (x, df) => 1 - jStat.chisquare.cdf(x, df);

/** Average ranks (1-based) plus the tie groups' sizes, for rank tests. */
export function rank(values) {
  const idx = values.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
  const ranks = new Array(values.length);
  const ties = [];
  for (let i = 0; i < idx.length;) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
    for (let k = i; k <= j; k++) ranks[idx[k][1]] = (i + j) / 2 + 1;
    if (j > i) ties.push(j - i + 1);
    i = j + 1;
  }
  return { ranks, ties };
}
const tieSum = ties => sum(ties.map(t => t ** 3 - t));

// ---------------------------------------------------------------- normality

/** Shapiro-Wilk W and p (Royston 1995, algorithm AS R94 as in R's swilk.c). Valid for 3 <= n <= 5000. */
export function shapiroWilk(x) {
  const n = x.length;
  if (n < 3 || n > 5000) return null;
  const xs = [...x].sort((a, b) => a - b);
  if (xs[n - 1] - xs[0] < 1e-10) return null; // all values equal
  const poly = (c, v) => c.reduceRight((r, k) => r * v + k, 0);
  const nn2 = Math.floor(n / 2);
  const a = new Array(nn2 + 1);
  if (n === 3) a[1] = Math.SQRT1_2;
  else {
    const an25 = n + 0.25;
    const m = [0];
    for (let i = 1; i <= nn2; i++) m[i] = jStat.normal.inv((i - 0.375) / an25, 0, 1);
    const summ2 = 2 * sum(m.slice(1).map(v => v * v));
    const ssumm2 = Math.sqrt(summ2);
    const rsn = 1 / Math.sqrt(n);
    const a1 = poly([0, 0.221157, -0.147981, -2.07119, 4.434685, -2.706056], rsn) - m[1] / ssumm2;
    let i1, fac;
    if (n > 5) {
      i1 = 3;
      const a2 = -m[2] / ssumm2 + poly([0, 0.042981, -0.293762, -1.752461, 5.682633, -3.582633], rsn);
      fac = Math.sqrt((summ2 - 2 * m[1] ** 2 - 2 * m[2] ** 2) / (1 - 2 * a1 ** 2 - 2 * a2 ** 2));
      a[2] = a2;
    } else {
      i1 = 2;
      fac = Math.sqrt((summ2 - 2 * m[1] ** 2) / (1 - 2 * a1 ** 2));
    }
    a[1] = a1;
    for (let i = i1; i <= nn2; i++) a[i] = -m[i] / fac;
  }
  const mu = mean(xs);
  let num = 0;
  for (let i = 1; i <= nn2; i++) num += a[i] * (xs[n - i] - xs[i - 1]);
  const W = Math.min(1, num ** 2 / sum(xs.map(v => (v - mu) ** 2)));

  let p;
  if (n === 3) p = Math.max(0, (6 / Math.PI) * (Math.asin(Math.sqrt(W)) - Math.PI / 3));
  else {
    let y = Math.log(1 - W);
    let m, s;
    if (n <= 11) {
      const gamma = poly([-2.273, 0.459], n);
      if (y >= gamma) return { W, p: 1e-99 };
      y = -Math.log(gamma - y);
      m = poly([0.544, -0.39978, 0.025054, -6.714e-4], n);
      s = Math.exp(poly([1.3822, -0.77857, 0.062767, -0.0020322], n));
    } else {
      const ln = Math.log(n);
      m = poly([-1.5861, -0.31082, -0.083751, 0.0038915], ln);
      s = Math.exp(poly([-0.4803, -0.082676, 0.0030302], ln));
    }
    p = 1 - jStat.normal.cdf(y, m, s);
  }
  return { W, p };
}

// ---------------------------------------------------------------- two groups

const describe = a => ({ n: a.length, mean: mean(a), sd: a.length > 1 ? sd(a) : 0, median: jStat.median(a) });
const pooledSd = (a, b) => Math.sqrt(((a.length - 1) * variance(a) + (b.length - 1) * variance(b)) / (a.length + b.length - 2));

export function tTest(a, b) {
  const df = a.length + b.length - 2;
  const sp = pooledSd(a, b);
  const t = (mean(a) - mean(b)) / (sp * Math.sqrt(1 / a.length + 1 / b.length));
  return { test: 'indTTest', t, df, p: pT(t, df), d: (mean(a) - mean(b)) / sp, groups: [describe(a), describe(b)] };
}

export function welchTTest(a, b) {
  const va = variance(a) / a.length, vb = variance(b) / b.length;
  const t = (mean(a) - mean(b)) / Math.sqrt(va + vb);
  const df = (va + vb) ** 2 / (va ** 2 / (a.length - 1) + vb ** 2 / (b.length - 1));
  return { test: 'welchTTest', t, df, p: pT(t, df), d: (mean(a) - mean(b)) / pooledSd(a, b), groups: [describe(a), describe(b)] };
}

/** Coefficients of the Gaussian binomial [m+n choose m]_q: the null distribution counts of U. */
function mannWhitneyCounts(m, n) {
  const deg = m * n;
  let c = new Array(deg + 1).fill(0);
  c[0] = 1;
  for (let i = 1; i <= m; i++) {
    // multiply by (1 - q^(n+i)) then divide by (1 - q^i)
    for (let k = deg; k >= n + i; k--) c[k] -= c[k - n - i];
    for (let k = i; k <= deg; k++) c[k] += c[k - i];
  }
  return c;
}

/** Mann-Whitney U (R's W = U of the first group). Exact p below 50 per group without ties, else normal approximation. */
export function mannWhitneyU(a, b) {
  const n1 = a.length, n2 = b.length, N = n1 + n2;
  const { ranks, ties } = rank([...a, ...b]);
  const U = sum(ranks.slice(0, n1)) - n1 * (n1 + 1) / 2;
  const mu = n1 * n2 / 2;
  const sigma = Math.sqrt(n1 * n2 / 12 * ((N + 1) - tieSum(ties) / (N * (N - 1))));
  const z = (U - mu) / sigma;
  let p, exact = false;
  if (n1 < 50 && n2 < 50 && ties.length === 0) {
    const c = mannWhitneyCounts(n1, n2);
    const total = sum(c);
    const lower = sum(c.slice(0, Math.round(U) + 1)) / total;
    const upper = sum(c.slice(Math.round(U))) / total;
    p = Math.min(1, 2 * Math.min(lower, upper));
    exact = true;
  } else {
    const zc = (U - mu - 0.5 * Math.sign(U - mu)) / sigma; // continuity correction, as R
    p = pZ(zc);
  }
  return { test: 'mannWhitneyU', U, z, p, exact, r: Math.abs(z) / Math.sqrt(N), groups: [describe(a), describe(b)] };
}

// ---------------------------------------------------------------- k groups

export function oneWayAnova(groups) {
  const all = groups.flat(), N = all.length, k = groups.length, gm = mean(all);
  const ssb = sum(groups.map(g => g.length * (mean(g) - gm) ** 2));
  const ssw = sum(groups.map(g => sum(g.map(v => (v - mean(g)) ** 2))));
  const df1 = k - 1, df2 = N - k;
  const F = (ssb / df1) / (ssw / df2);
  return { test: 'oneWayAnova', F, df1, df2, p: pF(F, df1, df2), eta2: ssb / (ssb + ssw), msw: ssw / df2, groups: groups.map(describe) };
}

export function welchAnova(groups) {
  const k = groups.length;
  const w = groups.map(g => g.length / variance(g));
  const W = sum(w);
  const mw = sum(groups.map((g, i) => w[i] * mean(g))) / W;
  const A = sum(groups.map((g, i) => w[i] * (mean(g) - mw) ** 2)) / (k - 1);
  const lam = sum(groups.map((g, i) => (1 - w[i] / W) ** 2 / (g.length - 1)));
  const F = A / (1 + 2 * (k - 2) / (k * k - 1) * lam);
  const df1 = k - 1, df2 = (k * k - 1) / (3 * lam);
  return { test: 'welchAnova', F, df1, df2, p: pF(F, df1, df2), eta2: oneWayAnova(groups).eta2, groups: groups.map(describe) };
}

export function kruskalWallis(groups) {
  const all = groups.flat(), N = all.length, k = groups.length;
  const { ranks, ties } = rank(all);
  let at = 0, h = 0;
  const meanRanks = groups.map(g => {
    const r = sum(ranks.slice(at, at + g.length));
    at += g.length;
    h += r * r / g.length;
    return r / g.length;
  });
  const H = (12 / (N * (N + 1)) * h - 3 * (N + 1)) / (1 - tieSum(ties) / (N ** 3 - N));
  return { test: 'kruskalWallis', H, df: k - 1, p: pChi(H, k - 1), epsilon2: H / (N - 1), meanRanks, ties, N, groups: groups.map(describe) };
}

// ---------------------------------------------------------------- post-hoc

const pairs = k => { const out = []; for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) out.push([i, j]); return out; };
const ptukey = (q, k, df) => Math.min(1, Math.max(0, 1 - jStat.tukey.cdf(q, k, df)));

/** Tukey HSD (Tukey-Kramer for unequal n). */
export function tukeyHSD(groups) {
  const { msw, df2 } = oneWayAnova(groups);
  return pairs(groups.length).map(([i, j]) => {
    const diff = mean(groups[i]) - mean(groups[j]);
    const q = Math.abs(diff) / Math.sqrt(msw / 2 * (1 / groups[i].length + 1 / groups[j].length));
    return { i, j, diff, stat: q, p: ptukey(q, groups.length, df2) };
  });
}

export function gamesHowell(groups) {
  return pairs(groups.length).map(([i, j]) => {
    const vi = variance(groups[i]) / groups[i].length, vj = variance(groups[j]) / groups[j].length;
    const diff = mean(groups[i]) - mean(groups[j]);
    const q = Math.abs(diff) / Math.sqrt((vi + vj) / 2);
    const df = (vi + vj) ** 2 / (vi ** 2 / (groups[i].length - 1) + vj ** 2 / (groups[j].length - 1));
    return { i, j, diff, stat: q, p: ptukey(q, groups.length, df) };
  });
}

/** Dunn's test with Bonferroni adjustment, after Kruskal-Wallis. */
export function dunn(groups) {
  const { meanRanks, ties, N } = kruskalWallis(groups);
  const ps = pairs(groups.length);
  const base = N * (N + 1) / 12 - tieSum(ties) / (12 * (N - 1));
  return ps.map(([i, j]) => {
    const z = (meanRanks[i] - meanRanks[j]) / Math.sqrt(base * (1 / groups[i].length + 1 / groups[j].length));
    return { i, j, diff: meanRanks[i] - meanRanks[j], stat: z, p: Math.min(1, pZ(z) * ps.length) };
  });
}

// ---------------------------------------------------------------- paired

export function pairedTTest(a, b) {
  const d = a.map((v, i) => v - b[i]);
  const n = d.length, t = mean(d) / (sd(d) / Math.sqrt(n));
  return { test: 'pairedTTest', t, df: n - 1, p: pT(t, n - 1), d: mean(d) / sd(d), n, groups: [describe(a), describe(b)], diff: describe(d) };
}

/** Wilcoxon signed-rank (R's V = sum of positive ranks). Exact below 50 pairs without ties or zeros. */
export function wilcoxonSignedRank(a, b) {
  const all = a.map((v, i) => v - b[i]);
  const d = all.filter(v => v !== 0);
  const n = d.length;
  const { ranks, ties } = rank(d.map(Math.abs));
  const V = sum(ranks.filter((_, i) => d[i] > 0));
  const mu = n * (n + 1) / 4;
  const sigma = Math.sqrt(n * (n + 1) * (2 * n + 1) / 24 - tieSum(ties) / 48);
  const z = (V - mu) / sigma;
  let p, exact = false;
  if (n < 50 && ties.length === 0 && n === all.length) {
    const max = n * (n + 1) / 2;
    const c = new Array(max + 1).fill(0);
    c[0] = 1;
    for (let r = 1; r <= n; r++) for (let s = max; s >= r; s--) c[s] += c[s - r];
    const total = 2 ** n;
    p = Math.min(1, 2 * Math.min(sum(c.slice(0, V + 1)), sum(c.slice(V))) / total);
    exact = true;
  } else p = pZ((V - mu - 0.5 * Math.sign(V - mu)) / sigma);
  return { test: 'wilcoxon', V, z, p, exact, r: Math.abs(z) / Math.sqrt(n), n: a.length, zeros: all.length - n, groups: [describe(a), describe(b)] };
}

// ---------------------------------------------------------------- categorical

/** Pearson chi-square of independence on a contingency table (rows x cols of counts). */
export function chiSquare(table) {
  const r = table.length, c = table[0].length;
  const rowT = table.map(sum), colT = table[0].map((_, j) => sum(table.map(row => row[j]))), N = sum(rowT);
  const expected = table.map((_, i) => colT.map(cj => rowT[i] * cj / N));
  let x2 = 0;
  table.forEach((row, i) => row.forEach((o, j) => { x2 += (o - expected[i][j]) ** 2 / expected[i][j]; }));
  const df = (r - 1) * (c - 1);
  const cells = expected.flat();
  return {
    test: 'chiSquare', x2, df, p: pChi(x2, df), N, expected,
    cramerV: Math.sqrt(x2 / (N * (Math.min(r, c) - 1))),
    lowExpected: cells.filter(e => e < 5).length / cells.length, // share of cells with E < 5
    minExpected: Math.min(...cells),
  };
}

/** Fisher's exact test for a 2x2 table, two-sided (R's method: sum of tables no more likely than the observed). */
export function fisherExact([[a, b], [c, d]]) {
  const lf = n => jStat.gammaln(n + 1);
  const r1 = a + b, r2 = c + d, c1 = a + c, N = r1 + r2;
  const prob = x => Math.exp(lf(r1) + lf(r2) + lf(c1) + lf(N - c1) - lf(N) - lf(x) - lf(r1 - x) - lf(c1 - x) - lf(r2 - c1 + x));
  const pObs = prob(a);
  let p = 0;
  for (let x = Math.max(0, c1 - r2); x <= Math.min(r1, c1); x++) { const px = prob(x); if (px <= pObs * (1 + 1e-7)) p += px; }
  return { test: 'fisher', p: Math.min(1, p), oddsRatio: (a * d) / (b * c) };
}

// ---------------------------------------------------------------- correlation

export function pearson(x, y) {
  const mx = mean(x), my = mean(y);
  let sxy = 0, sxx = 0, syy = 0;
  x.forEach((v, i) => { sxy += (v - mx) * (y[i] - my); sxx += (v - mx) ** 2; syy += (y[i] - my) ** 2; });
  const r = sxy / Math.sqrt(sxx * syy), n = x.length;
  const t = r * Math.sqrt((n - 2) / (1 - r * r));
  return { r, n, p: Math.abs(r) >= 1 ? 0 : pT(t, n - 2) };
}

/** Spearman's rho; p from the t approximation (R uses exact p for small n without ties). */
export const spearman = (x, y) => pearson(rank(x).ranks, rank(y).ranks);

// ---------------------------------------------------------------- regression

/** Inverse of a small symmetric positive-definite matrix (Gauss-Jordan). Returns null if singular. */
function invert(M) {
  const n = M.length, A = M.map((row, i) => [...row, ...row.map((_, j) => +(i === j))]);
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
    if (Math.abs(A[piv][c]) < 1e-12) return null;
    [A[c], A[piv]] = [A[piv], A[c]];
    const p = A[c][c];
    for (let j = 0; j < 2 * n; j++) A[c][j] /= p;
    for (let r = 0; r < n; r++) if (r !== c) { const f = A[r][c]; for (let j = 0; j < 2 * n; j++) A[r][j] -= f * A[c][j]; }
  }
  return A.map(row => row.slice(n));
}
const xtwx = (X, w) => X[0].map((_, i) => X[0].map((_, j) => sum(X.map((row, k) => row[i] * row[j] * (w ? w[k] : 1)))));
const xtv = (X, v) => X[0].map((_, i) => sum(X.map((row, k) => row[i] * v[k])));
const withIntercept = rows => rows.map(r => [1, ...r]);

/** Ordinary least squares. X: rows of predictor values (no intercept column). */
export function linearRegression(X, y) {
  const D = withIntercept(X), n = D.length, p = D[0].length;
  const inv = invert(xtwx(D));
  if (!inv) return null;
  const xy = xtv(D, y);
  const beta = inv.map(row => sum(row.map((v, j) => v * xy[j])));
  const fitted = D.map(row => sum(row.map((v, j) => v * beta[j])));
  const rss = sum(y.map((v, i) => (v - fitted[i]) ** 2));
  const tss = sum(y.map(v => (v - mean(y)) ** 2));
  const s2 = rss / (n - p);
  const coef = beta.map((b, j) => {
    const se = Math.sqrt(s2 * inv[j][j]), t = b / se;
    return { b, se, stat: t, p: pT(t, n - p) };
  });
  const r2 = 1 - rss / tss;
  const F = ((tss - rss) / (p - 1)) / s2;
  return { kind: 'linear', coef, n, r2, adjR2: 1 - (1 - r2) * (n - 1) / (n - p), F, df1: p - 1, df2: n - p, pF: pF(F, p - 1, n - p),
    predict: xs => sum([1, ...xs].map((v, j) => v * beta[j])) };
}

/** Logistic regression by Newton-Raphson (IRLS). y must be 0/1. */
export function logisticRegression(X, y) {
  const D = withIntercept(X), n = D.length;
  let beta = new Array(D[0].length).fill(0), inv = null;
  const prob = row => 1 / (1 + Math.exp(-sum(row.map((v, j) => v * beta[j]))));
  for (let it = 0; it < 50; it++) {
    const mu = D.map(prob);
    inv = invert(xtwx(D, mu.map(m => m * (1 - m))));
    if (!inv) return null;
    const g = xtv(D, y.map((v, i) => v - mu[i]));
    const step = inv.map(row => sum(row.map((v, j) => v * g[j])));
    beta = beta.map((b, j) => b + step[j]);
    if (Math.max(...step.map(Math.abs)) < 1e-10) break;
  }
  const mu = D.map(prob);
  const ll = sum(y.map((v, i) => v ? Math.log(mu[i]) : Math.log(1 - mu[i])));
  const p0 = mean(y), ll0 = n * (p0 * Math.log(p0) + (1 - p0) * Math.log(1 - p0));
  inv = invert(xtwx(D, mu.map(m => m * (1 - m))));
  const coef = beta.map((b, j) => {
    const se = Math.sqrt(inv[j][j]), z = b / se;
    return { b, se, stat: z, p: pZ(z), or: Math.exp(b) };
  });
  const chi = 2 * (ll - ll0), df = D[0].length - 1;
  return { kind: 'logistic', coef, n, pseudoR2: 1 - ll / ll0, chi2: chi, df, pModel: pChi(chi, df),
    accuracy: mean(mu.map((m, i) => +((m >= 0.5) === (y[i] === 1)))),
    predict: xs => 1 / (1 + Math.exp(-sum([1, ...xs].map((v, j) => v * beta[j])))) };
}

// ---------------------------------------------------------------- data quality

/** Indexes of outliers in `values` (numbers): IQR rule (1.5 x IQR outside the quartiles) or |z| > 3. */
export function outlierIndexes(values, method = 'iqr') {
  if (values.length < 4) return [];
  if (method === 'z') {
    const m = mean(values), s = sd(values);
    return s ? values.flatMap((v, i) => Math.abs((v - m) / s) > 3 ? [i] : []) : [];
  }
  const q1 = jStat.percentile(values, 0.25), q3 = jStat.percentile(values, 0.75), iqr = q3 - q1;
  return values.flatMap((v, i) => v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr ? [i] : []);
}

/** Levene's test (mean-centred, as the classic form): an ANOVA on |x - group mean|. */
export function levene(groups) {
  const z = groups.map(g => { const m = mean(g); return g.map(v => Math.abs(v - m)); });
  const { F, df1, df2, p } = oneWayAnova(z);
  return { F, df1, df2, p };
}
