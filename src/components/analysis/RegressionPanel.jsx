import React, { useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { fix, fmtP, nz, regressionSentence } from '../../utils/apa';
import Chips from './Chips';
import { CopyButton, Notice, PBadge, Panel, Select, Sentence, Table } from './ui';

function Predict({ rg }) {
  const { t } = useLanguage();
  const [vals, setVals] = useState({});
  const ready = rg.xs.every(x => vals[x] !== undefined && vals[x] !== '' && isFinite(Number(vals[x])));
  const out = ready ? rg.predict(rg.xs.map(x => Number(vals[x]))) : null;
  return (
    <div className="rounded-xl border border-slate-200 p-4 space-y-3">
      <h4 className="font-semibold text-slate-700">{t.predictTitle}</h4>
      <div className="flex flex-wrap gap-3">
        {rg.xs.map(x => (
          <label key={x} className="text-sm text-slate-600 flex flex-col gap-1">
            {x}
            <input type="number" inputMode="decimal" value={vals[x] ?? ''} onChange={e => setVals(v => ({ ...v, [x]: e.target.value }))}
              className="w-32 border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </label>
        ))}
      </div>
      {out !== null && (
        <p className="text-sm">
          {rg.kind === 'linear'
            ? <>{t.predictedValue} ({rg.y}): <span className="font-semibold text-blue-700">{fix(out, 3)}</span></>
            : <>{t.predictedProb} ({rg.y} = {rg.positive}): <span className="font-semibold text-blue-700">{(out * 100).toFixed(1)}%</span></>}
        </p>
      )}
    </div>
  );
}

export default function RegressionPanel({ results, config, setConfig, numeric, columns }) {
  const { t, language } = useLanguage();
  const ref = useRef(null);
  const spec = config.regression, rg = results.regression;
  const setReg = patch => setConfig(c => ({ ...c, regression: { ...c.regression, ...patch } }));
  const outcomes = spec.kind === 'linear' ? numeric : columns;
  return (
    <Panel title={t.regTitle} desc={t.regDesc}>
      <div className="flex flex-wrap items-center gap-3">
        <Select value={spec.kind} onChange={kind => setReg({ kind, y: '', positive: '' })} options={[{ value: 'linear', label: t.linear }, { value: 'logistic', label: t.logistic }]} />
        <Select value={spec.y} onChange={y => setReg({ y, xs: spec.xs.filter(x => x !== y), positive: '' })} options={outcomes} placeholder={t.outcome} />
        {spec.kind === 'logistic' && rg?.levels && (
          <label className="text-sm text-slate-600 flex items-center gap-2">{t.positiveClass}
            <Select value={rg.positive} onChange={positive => setReg({ positive })} options={rg.levels} />
          </label>
        )}
      </div>
      <div className="space-y-2">
        <p className="text-sm text-slate-600">{t.predictors}</p>
        <Chips options={numeric.filter(c => c !== spec.y)} selected={spec.xs} onChange={f => setConfig(c => ({ ...c, regression: { ...c.regression, xs: f(c.regression.xs) } }))} />
      </div>
      {rg?.error && <Notice>{t[rg.error]}{rg.levels ? ` (${rg.levels.length})` : ''}</Notice>}
      {rg && !rg.error && (
        <>
          <div className="flex flex-wrap justify-between items-center gap-3">
            <p className="text-sm text-slate-600">
              n = {rg.n}
              <span className="mx-2 text-slate-300">|</span>
              {rg.kind === 'linear'
                ? <>R² = {nz(rg.r2)}, {t.adjR2} = {nz(rg.adjR2)}, F({rg.df1}, {rg.df2}) = {fix(rg.F)}, {fmtP(rg.pF)}</>
                : <>χ²({rg.df}) = {fix(rg.chi2)}, {fmtP(rg.pModel)}, McFadden R² = {nz(rg.pseudoR2)}, {t.accuracy} = {(rg.accuracy * 100).toFixed(1)}%</>}
            </p>
            <CopyButton target={ref} label={t.copyTable} />
          </div>
          <Table tableRef={ref} caption={`${rg.y} ~ ${rg.xs.join(' + ')}`}
            head={[t.term, 'b', 'SE', rg.kind === 'linear' ? 't' : 'z', 'p', ...(rg.kind === 'logistic' ? ['OR'] : [])]}
            rows={rg.coef.map((c, j) => [j === 0 ? t.intercept : rg.xs[j - 1], fix(c.b, 3), fix(c.se, 3), fix(c.stat), <PBadge p={c.p} />, ...(rg.kind === 'logistic' ? [fix(c.or, 3)] : [])])} />
          <Sentence text={regressionSentence(rg, language)} />
          <Predict key={rg.xs.join('|') + rg.y} rg={rg} />
        </>
      )}
    </Panel>
  );
}
