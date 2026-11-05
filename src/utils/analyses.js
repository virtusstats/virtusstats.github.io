// Runs the analyses on the uploaded rows. Everything the user picks lives in one `config` object,
// which is also what "save / share analysis" writes out.
import * as I from './inference.js';

export const ALPHA = 0.05;
export const isNumericType = t => t === 'ratio' || t === 'interval';
export const isCategoricalType = t => t === 'nominal' || t === 'ordinal';
const present = v => v !== null && v !== undefined && v !== '';
const num = v => (present(v) && !isNaN(Number(v)) ? Number(v) : null);

export const emptyConfig = () => ({
  groupingVariable: '',
  outlierMethod: 'iqr',
  exclusions: [], // numeric columns whose outliers are treated as missing
  pairs: [], // [{ a, b }] before/after columns for paired tests
  crosstabs: [], // [{ a, b }] categorical columns for chi-square
  corr: { vars: [], method: 'auto' },
  regression: { kind: 'linear', y: '', xs: [], positive: '' },
});

/** Keep only what still fits these columns (a config loaded from a file or link may name other columns). */
export function sanitizeConfig(cfg, columnTypes) {
  const base = emptyConfig();
  if (!cfg || typeof cfg !== 'object') return base;
  const has = c => typeof c === 'string' && c in columnTypes;
  const numeric = c => has(c) && isNumericType(columnTypes[c]);
  const categorical = c => has(c) && isCategoricalType(columnTypes[c]);
  const pairsOf = (list, ok) => (Array.isArray(list) ? list : []).filter(p => p && ok(p.a) && ok(p.b) && p.a !== p.b).map(({ a, b }) => ({ a, b }));
  const reg = cfg.regression || {};
  return {
    groupingVariable: categorical(cfg.groupingVariable) ? cfg.groupingVariable : '',
    outlierMethod: cfg.outlierMethod === 'z' ? 'z' : 'iqr',
    exclusions: (Array.isArray(cfg.exclusions) ? cfg.exclusions : []).filter(numeric),
    pairs: pairsOf(cfg.pairs, numeric),
    crosstabs: pairsOf(cfg.crosstabs, categorical),
    corr: {
      vars: (Array.isArray(cfg.corr?.vars) ? cfg.corr.vars : []).filter(numeric),
      method: ['pearson', 'spearman'].includes(cfg.corr?.method) ? cfg.corr.method : 'auto',
    },
    regression: {
      kind: reg.kind === 'logistic' ? 'logistic' : 'linear',
      y: has(reg.y) ? reg.y : '',
      xs: (Array.isArray(reg.xs) ? reg.xs : []).filter(c => numeric(c) && c !== reg.y),
      positive: typeof reg.positive === 'string' ? reg.positive : '',
    },
  };
}

// ---------------------------------------------------------------- data quality

/** Missing count and outliers for every column. */
export function dataQuality(data, columnTypes, method) {
  return Object.entries(columnTypes).map(([col, type]) => {
    const missing = data.filter(r => !present(r[col])).length;
    const out = { col, type, n: data.length, missing, outliers: [] };
    if (isNumericType(type)) {
      const rows = data.flatMap((r, i) => (num(r[col]) === null ? [] : [[i, num(r[col])]]));
      out.outliers = I.outlierIndexes(rows.map(r => r[1]), method).map(k => ({ row: rows[k][0], value: rows[k][1] }));
    }
    return out;
  });
}

/** Rows with the outliers of the excluded columns blanked out, so every analysis treats them as missing. */
export function applyExclusions(data, columnTypes, config) {
  if (!config.exclusions.length) return data;
  const drop = {};
  dataQuality(data, columnTypes, config.outlierMethod)
    .filter(q => config.exclusions.includes(q.col))
    .forEach(q => { drop[q.col] = new Set(q.outliers.map(o => o.row)); });
  return data.map((r, i) => {
    const copy = { ...r };
    for (const col in drop) if (drop[col].has(i)) copy[col] = null;
    return copy;
  });
}

// ---------------------------------------------------------------- normality

/** Shapiro-Wilk up to 5000 values, Jarque-Bera above (where SW is not defined and JB is accurate). */
export function normality(values) {
  if (values.length < 3) return null;
  if (values.length <= 5000) {
    const r = I.shapiroWilk(values);
    return r && { test: 'shapiroWilk', stat: r.W, p: r.p, normal: r.p >= ALPHA };
  }
  const n = values.length, m = I.mean(values), s2 = values.reduce((s, v) => s + (v - m) ** 2, 0) / n;
  const skew = values.reduce((s, v) => s + (v - m) ** 3, 0) / n / s2 ** 1.5;
  const kurt = values.reduce((s, v) => s + (v - m) ** 4, 0) / n / s2 ** 2 - 3;
  const jb = (n / 6) * (skew ** 2 + kurt ** 2 / 4);
  const p = Math.exp(-jb / 2); // chi-square with 2 df
  return { test: 'jarqueBera', stat: jb, p, normal: p >= ALPHA };
}

// ---------------------------------------------------------------- comparisons

function splitByGroup(data, col, groupVar) {
  const groups = new Map();
  data.forEach(r => {
    const v = num(r[col]), g = r[groupVar];
    if (v === null || !present(g)) return;
    const key = String(g);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(v);
  });
  const names = [...groups.keys()].sort((x, y) => x.localeCompare(y, undefined, { numeric: true }));
  return { names, values: names.map(n => groups.get(n)) };
}

/**
 * Compare a numeric column across the groups of a categorical one: check normality per group and
 * equal variances, pick the test, run it, and add post-hoc comparisons when 3+ groups differ.
 */
export function compareGroups(data, col, groupVar) {
  const { names, values } = splitByGroup(data, col, groupVar);
  if (names.length < 2) return { col, groupVar, error: 'needTwoGroups' };
  if (values.some(v => v.length < 2)) return { col, groupVar, names, error: 'groupTooSmall' };
  const norm = values.map(normality);
  const normal = norm.every(r => r && r.normal);
  const lev = I.levene(values);
  const equalVar = lev.p >= ALPHA;
  let result, posthoc = null;
  if (names.length === 2) {
    result = normal ? (equalVar ? I.tTest(...values) : I.welchTTest(...values)) : I.mannWhitneyU(...values);
  } else {
    result = normal ? (equalVar ? I.oneWayAnova(values) : I.welchAnova(values)) : I.kruskalWallis(values);
    if (result.p < ALPHA) {
      const method = normal ? (equalVar ? 'tukey' : 'gamesHowell') : 'dunn';
      const rows = { tukey: I.tukeyHSD, gamesHowell: I.gamesHowell, dunn: I.dunn }[method](values);
      posthoc = { method, rows: rows.map(r => ({ ...r, a: names[r.i], b: names[r.j] })) };
    }
  }
  return { col, groupVar, names, normality: norm, normal, levene: lev, equalVar, result, posthoc };
}

/** Paired comparison of two numeric columns (rows where both are present). */
export function comparePaired(data, a, b) {
  const rows = data.filter(r => num(r[a]) !== null && num(r[b]) !== null);
  if (rows.length < 3) return { a, b, error: 'notEnoughPairs' };
  const x = rows.map(r => num(r[a])), y = rows.map(r => num(r[b]));
  const norm = normality(x.map((v, i) => v - y[i]));
  const normal = !!(norm && norm.normal);
  return { a, b, normality: norm, normal, result: normal ? I.pairedTTest(x, y) : I.wilcoxonSignedRank(x, y) };
}

/** Contingency table of two categorical columns with chi-square, and Fisher's exact test for sparse 2x2 tables. */
export function crosstab(data, a, b) {
  const rows = data.filter(r => present(r[a]) && present(r[b]));
  const sortKeys = s => [...s].sort((x, y) => x.localeCompare(y, undefined, { numeric: true }));
  const ra = sortKeys(new Set(rows.map(r => String(r[a])))), cb = sortKeys(new Set(rows.map(r => String(r[b]))));
  if (ra.length < 2 || cb.length < 2) return { a, b, error: 'needTwoCategories' };
  const table = ra.map(x => cb.map(y => rows.filter(r => String(r[a]) === x && String(r[b]) === y).length));
  const chi = I.chiSquare(table);
  const fisher = ra.length === 2 && cb.length === 2 && chi.minExpected < 5 ? I.fisherExact(table) : null;
  return { a, b, rowLabels: ra, colLabels: cb, table, chi, fisher };
}

/** Correlation matrix with pairwise-complete rows; 'auto' uses Spearman when any variable is not normal. */
export function correlationMatrix(data, vars, method = 'auto') {
  if (vars.length < 2) return { vars, error: 'needTwoVariables' };
  let used = method;
  if (method === 'auto') {
    const allNormal = vars.every(v => normality(data.map(r => num(r[v])).filter(x => x !== null))?.normal);
    used = allNormal ? 'pearson' : 'spearman';
  }
  const fn = used === 'pearson' ? I.pearson : I.spearman;
  const cells = vars.map((v1, i) => vars.map((v2, j) => {
    if (i === j) return { r: 1, p: 0, n: data.filter(r => num(r[v1]) !== null).length };
    const rows = data.filter(r => num(r[v1]) !== null && num(r[v2]) !== null);
    return rows.length < 3 ? { r: NaN, p: NaN, n: rows.length } : fn(rows.map(r => num(r[v1])), rows.map(r => num(r[v2])));
  }));
  return { vars, method: used, cells };
}

/** Linear (numeric outcome) or logistic (two-category outcome) regression on numeric predictors. */
export function regression(data, columnTypes, spec) {
  const { kind, y, xs } = spec;
  if (!y || !xs.length) return { error: 'pickVariables' };
  const rows = data.filter(r => xs.every(x => num(r[x]) !== null) && present(r[y]));
  const X = rows.map(r => xs.map(x => num(r[x])));
  if (kind === 'linear') {
    if (!isNumericType(columnTypes[y])) return { error: 'outcomeNumeric' };
    const keep = rows.map(r => num(r[y]) !== null);
    const fit = I.linearRegression(X.filter((_, i) => keep[i]), rows.filter((_, i) => keep[i]).map(r => num(r[y])));
    if (!fit || fit.n <= xs.length + 1) return { error: 'cannotFit' };
    return { ...fit, y, xs };
  }
  const levels = [...new Set(rows.map(r => String(r[y])))].sort();
  if (levels.length !== 2) return { error: 'outcomeBinary', levels };
  const positive = levels.includes(spec.positive) ? spec.positive : levels[1];
  const fit = I.logisticRegression(X, rows.map(r => +(String(r[y]) === positive)));
  if (!fit || fit.coef.some(c => !isFinite(c.se))) return { error: 'cannotFit' }; // e.g. perfect separation
  return { ...fit, y, xs, levels, positive };
}

/** Everything the report needs, computed once from the current config. */
export function runAll(data, columnTypes, config) {
  const clean = applyExclusions(data, columnTypes, config);
  const numericCols = Object.keys(columnTypes).filter(c => isNumericType(columnTypes[c]));
  return {
    clean,
    quality: dataQuality(data, columnTypes, config.outlierMethod),
    groups: config.groupingVariable ? numericCols.map(c => compareGroups(clean, c, config.groupingVariable)) : [],
    paired: config.pairs.map(p => comparePaired(clean, p.a, p.b)),
    crosstabs: config.crosstabs.map(p => crosstab(clean, p.a, p.b)),
    correlation: config.corr.vars.length >= 2 ? correlationMatrix(clean, config.corr.vars, config.corr.method) : null,
    regression: config.regression.y && config.regression.xs.length ? regression(clean, columnTypes, config.regression) : null,
  };
}
