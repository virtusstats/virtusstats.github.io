// APA 7 style statistics and ready-to-paste result sentences, in Turkish and English.
import { ALPHA } from './analyses.js';

const fix = (x, d = 2) => (isFinite(x) ? Number(x).toFixed(d) : '–');
/** Values that cannot exceed 1 (p, r, eta squared, Cramér's V) drop the leading zero in APA style. */
const nz = (x, d = 2) => fix(x, d).replace(/^(-?)0\./, '$1.');
export const fmtP = p => (p < 0.001 ? 'p < .001' : `p = ${nz(p, 3)}`);
const df = x => (Number.isInteger(x) ? String(x) : fix(x, 2));

const L = {
  tr: {
    M: 'Ort', SD: 'SS', and: 've', sig: 'anlamlı', notSig: 'anlamlı değil',
    effect: { small: 'küçük', medium: 'orta', large: 'büyük', negligible: 'ihmal edilebilir' },
    effectWord: s => `${s} düzeyde etki`,
    tests: {
      indTTest: 'Bağımsız örneklem t-testi', welchTTest: 'Welch t-testi', mannWhitneyU: 'Mann-Whitney U testi',
      oneWayAnova: 'Tek yönlü ANOVA', welchAnova: 'Welch ANOVA', kruskalWallis: 'Kruskal-Wallis H testi',
      pairedTTest: 'Eşleştirilmiş örneklem t-testi', wilcoxon: 'Wilcoxon işaretli sıralar testi',
      chiSquare: 'Ki-kare bağımsızlık testi', fisher: 'Fisher kesin testi',
      tukey: 'Tukey HSD', gamesHowell: 'Games-Howell', dunn: 'Dunn testi (Bonferroni düzeltmeli)',
      shapiroWilk: 'Shapiro-Wilk testi', jarqueBera: 'Jarque-Bera testi',
    },
    group: (t, col, gv, desc, sig) => `${t} sonucuna göre ${col} değişkeni ${gv} grupları arasında ${sig ? 'anlamlı farklılık göstermektedir' : 'anlamlı farklılık göstermemektedir'} (${desc})`,
    posthoc: (m, list) => list.length ? `${m} ile yapılan ikili karşılaştırmalarda anlamlı farklar: ${list}.` : `${m} ile yapılan ikili karşılaştırmalarda anlamlı fark bulunmamıştır.`,
    paired: (t, a, b, sig) => `${t} sonucuna göre ${a} ile ${b} arasındaki fark ${sig ? 'anlamlıdır' : 'anlamlı değildir'}`,
    cross: (t, a, b, sig) => `${t} sonucuna göre ${a} ile ${b} arasında ${sig ? 'anlamlı bir ilişki vardır' : 'anlamlı bir ilişki yoktur'}`,
    lowExp: pct => `Hücrelerin %${pct}'inde beklenen frekans 5'in altında; sonucu dikkatle yorumlayın.`,
    corr: (m, list) => list.length ? `${m} korelasyon analizine göre anlamlı ilişkiler: ${list}.` : `${m} korelasyon analizinde anlamlı ilişki bulunmamıştır.`,
    pearson: 'Pearson', spearman: 'Spearman',
    linear: (y, sig, stat) => `Çoklu doğrusal regresyon modeli ${y} değişkenini anlamlı olarak ${sig ? 'yordamaktadır' : 'yordamamaktadır'}, ${stat}.`,
    logistic: (y, pos, sig, stat) => `Lojistik regresyon modeli (${y} = ${pos} olasılığı) ${sig ? 'anlamlıdır' : 'anlamlı değildir'}, ${stat}.`,
    predictor: (x, sig, stat) => `${x} ${sig ? 'anlamlı bir yordayıcıdır' : 'anlamlı bir yordayıcı değildir'} (${stat})`,
    normal: (col, n, stat) => `${col}: ${n ? 'normal dağılım varsayımı sağlanmaktadır' : 'normal dağılım göstermemektedir'} (${stat}).`,
  },
  en: {
    M: 'M', SD: 'SD', and: 'and', sig: 'significant', notSig: 'not significant',
    effect: { small: 'small', medium: 'medium', large: 'large', negligible: 'negligible' },
    effectWord: s => `${s} effect`,
    tests: {
      indTTest: 'An independent-samples t-test', welchTTest: "Welch's t-test", mannWhitneyU: 'A Mann-Whitney U test',
      oneWayAnova: 'A one-way ANOVA', welchAnova: "Welch's ANOVA", kruskalWallis: 'A Kruskal-Wallis H test',
      pairedTTest: 'A paired-samples t-test', wilcoxon: 'A Wilcoxon signed-rank test',
      chiSquare: 'A chi-square test of independence', fisher: "Fisher's exact test",
      tukey: 'Tukey HSD', gamesHowell: 'Games-Howell', dunn: "Dunn's test (Bonferroni-adjusted)",
      shapiroWilk: 'Shapiro-Wilk test', jarqueBera: 'Jarque-Bera test',
    },
    group: (t, col, gv, desc, sig) => `${t} showed that ${col} ${sig ? 'differed significantly' : 'did not differ significantly'} across ${gv} groups (${desc})`,
    posthoc: (m, list) => list.length ? `${m} pairwise comparisons showed significant differences between ${list}.` : `${m} pairwise comparisons found no significant differences.`,
    paired: (t, a, b, sig) => `${t} showed that the difference between ${a} and ${b} was ${sig ? 'significant' : 'not significant'}`,
    cross: (t, a, b, sig) => `${t} showed ${sig ? 'a significant association' : 'no significant association'} between ${a} and ${b}`,
    lowExp: pct => `${pct}% of cells have an expected count below 5; interpret with caution.`,
    corr: (m, list) => list.length ? `${m} correlations showed significant relationships: ${list}.` : `${m} correlations found no significant relationships.`,
    pearson: 'Pearson', spearman: 'Spearman',
    linear: (y, sig, stat) => `The multiple linear regression model ${sig ? 'significantly predicted' : 'did not significantly predict'} ${y}, ${stat}.`,
    logistic: (y, pos, sig, stat) => `The logistic regression model (probability of ${y} = ${pos}) was ${sig ? 'significant' : 'not significant'}, ${stat}.`,
    predictor: (x, sig, stat) => `${x} was ${sig ? 'a significant predictor' : 'not a significant predictor'} (${stat})`,
    normal: (col, n, stat) => `${col}: ${n ? 'normally distributed' : 'not normally distributed'} (${stat}).`,
  },
};

/** Cohen's benchmarks: d .2/.5/.8, r and V .1/.3/.5, eta squared .01/.06/.14. */
export function effectLabel(kind, value) {
  const v = Math.abs(value);
  const cut = { d: [0.2, 0.5, 0.8], r: [0.1, 0.3, 0.5], eta2: [0.01, 0.06, 0.14] }[kind];
  return v < cut[0] ? 'negligible' : v < cut[1] ? 'small' : v < cut[2] ? 'medium' : 'large';
}
const eff = (lang, kind, value) => L[lang].effectWord(L[lang].effect[effectLabel(kind, value)]);

/** The inline statistic string for a test result, e.g. "t(48) = 2.31, p = .025, d = 0.65". */
export function stat(r) {
  switch (r.test) {
    case 'indTTest': case 'welchTTest': case 'pairedTTest':
      return `t(${df(r.df)}) = ${fix(r.t)}, ${fmtP(r.p)}, d = ${fix(r.d)}`;
    case 'mannWhitneyU': return `U = ${fix(r.U, r.U % 1 ? 1 : 0)}, z = ${fix(r.z)}, ${fmtP(r.p)}, r = ${nz(r.r)}`;
    case 'wilcoxon': return `V = ${fix(r.V, r.V % 1 ? 1 : 0)}, z = ${fix(r.z)}, ${fmtP(r.p)}, r = ${nz(r.r)}`;
    case 'oneWayAnova': case 'welchAnova': return `F(${df(r.df1)}, ${df(r.df2)}) = ${fix(r.F)}, ${fmtP(r.p)}, η² = ${nz(r.eta2)}`;
    case 'kruskalWallis': return `H(${r.df}) = ${fix(r.H)}, ${fmtP(r.p)}, ε² = ${nz(r.epsilon2)}`;
    case 'chiSquare': return `χ²(${r.df}, N = ${r.N}) = ${fix(r.x2)}, ${fmtP(r.p)}, V = ${nz(r.cramerV)}`;
    case 'fisher': return `${fmtP(r.p)}, OR = ${fix(r.oddsRatio)}`;
    default: return '';
  }
}

const effectOf = r => (r.d !== undefined ? ['d', r.d] : r.r !== undefined ? ['r', r.r] : r.eta2 !== undefined ? ['eta2', r.eta2]
  : r.epsilon2 !== undefined ? ['eta2', r.epsilon2] : r.cramerV !== undefined ? ['r', r.cramerV] : null);

export function groupSentence(cmp, lang) {
  if (cmp.error) return '';
  const l = L[lang], r = cmp.result, sig = r.p < ALPHA;
  const desc = cmp.names.map((n, i) => `${n}: ${l.M} = ${fix(r.groups[i].mean)}, ${l.SD} = ${fix(r.groups[i].sd)}`).join('; ');
  const [k, v] = effectOf(r);
  let s = `${l.group(l.tests[r.test], cmp.col, cmp.groupVar, desc, sig)}, ${stat(r)}; ${eff(lang, k, v)}.`;
  if (cmp.posthoc) {
    const list = cmp.posthoc.rows.filter(p => p.p < ALPHA).map(p => `${p.a}–${p.b} (${fmtP(p.p)})`).join(', ');
    s += ' ' + l.posthoc(l.tests[cmp.posthoc.method], list);
  }
  return s;
}

export function pairedSentence(cmp, lang) {
  if (cmp.error) return '';
  const l = L[lang], r = cmp.result, sig = r.p < ALPHA;
  const desc = [cmp.a, cmp.b].map((n, i) => `${n}: ${l.M} = ${fix(r.groups[i].mean)}, ${l.SD} = ${fix(r.groups[i].sd)}`).join('; ');
  const [k, v] = effectOf(r);
  return `${l.paired(l.tests[r.test], cmp.a, cmp.b, sig)} (${desc}), ${stat(r)}; ${eff(lang, k, v)}.`;
}

export function crosstabSentence(ct, lang) {
  if (ct.error) return '';
  const l = L[lang], main = ct.fisher || ct.chi, sig = main.p < ALPHA;
  let s = `${l.cross(l.tests[main.test], ct.a, ct.b, sig)}, ${stat(ct.chi)}${ct.fisher ? `; ${l.tests.fisher}: ${stat(ct.fisher)}` : ''}; ${eff(lang, 'r', ct.chi.cramerV)}.`;
  if (ct.chi.lowExpected > 0 && !ct.fisher) s += ' ' + l.lowExp(Math.round(ct.chi.lowExpected * 100));
  return s;
}

export function correlationSentence(cm, lang) {
  if (!cm || cm.error) return '';
  const l = L[lang], sym = cm.method === 'pearson' ? 'r' : 'rₛ', list = [];
  cm.vars.forEach((a, i) => cm.vars.forEach((b, j) => {
    const c = cm.cells[i][j];
    if (j > i && c.p < ALPHA) list.push(`${a}–${b} (${sym}(${c.n - 2}) = ${nz(c.r)}, ${fmtP(c.p)})`);
  }));
  return l.corr(l[cm.method], list.join(', '));
}

export function regressionSentence(rg, lang) {
  if (!rg || rg.error) return '';
  const l = L[lang];
  const preds = rg.xs.map((x, j) => {
    const c = rg.coef[j + 1];
    const s = rg.kind === 'linear'
      ? `b = ${fix(c.b)}, SE = ${fix(c.se)}, t(${rg.df2}) = ${fix(c.stat)}, ${fmtP(c.p)}`
      : `b = ${fix(c.b)}, SE = ${fix(c.se)}, z = ${fix(c.stat)}, ${fmtP(c.p)}, OR = ${fix(c.or)}`;
    return l.predictor(x, c.p < ALPHA, s);
  }).join('; ');
  const head = rg.kind === 'linear'
    ? l.linear(rg.y, rg.pF < ALPHA, `R² = ${nz(rg.r2)}, F(${rg.df1}, ${rg.df2}) = ${fix(rg.F)}, ${fmtP(rg.pF)}`)
    : l.logistic(rg.y, rg.positive, rg.pModel < ALPHA, `χ²(${rg.df}) = ${fix(rg.chi2)}, ${fmtP(rg.pModel)}, McFadden R² = ${nz(rg.pseudoR2)}`);
  return `${head} ${preds}.`;
}

export function normalitySentence(col, norm, lang) {
  if (!norm) return '';
  const l = L[lang], sym = norm.test === 'shapiroWilk' ? 'W' : 'JB';
  return l.normal(col, norm.normal, `${l.tests[norm.test]}, ${sym} = ${norm.test === 'shapiroWilk' ? nz(norm.stat, 3) : fix(norm.stat)}, ${fmtP(norm.p)}`);
}

export const testName = (key, lang) => L[lang].tests[key] || key;
export { fix, nz };
