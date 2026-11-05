import React, { useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { correlationSentence, fmtP, nz } from '../../utils/apa';
import { ALPHA } from '../../utils/analyses';
import Chips from './Chips';
import { CopyButton, Notice, Panel, Select, Sentence } from './ui';

/** Diverging fill: blue for positive, red for negative, stronger with |r|. */
const fill = r => (isFinite(r) ? (r >= 0 ? `rgba(18, 60, 105, ${Math.abs(r) * 0.85})` : `rgba(200, 50, 50, ${Math.abs(r) * 0.85})`) : 'transparent');
const stars = p => (p < 0.001 ? '***' : p < 0.01 ? '**' : p < ALPHA ? '*' : '');

export default function CorrelationPanel({ results, config, setConfig, numeric }) {
  const { t, language } = useLanguage();
  const ref = useRef(null);
  const cm = results.correlation;
  const setCorr = patch => setConfig(c => ({ ...c, corr: { ...c.corr, ...patch } }));
  return (
    <Panel
      title={t.corrTitle}
      desc={t.corrDesc}
      actions={<Select value={config.corr.method} onChange={method => setCorr({ method })}
        options={[{ value: 'auto', label: t.methodAuto }, { value: 'pearson', label: 'Pearson' }, { value: 'spearman', label: 'Spearman' }]} />}
    >
      {numeric.length < 2 ? <Notice>{t.needTwoNumeric}</Notice> : (
        <div className="space-y-2">
          <p className="text-sm text-slate-600">{t.pickVars}</p>
          <Chips options={numeric} selected={config.corr.vars} onChange={f => setConfig(c => ({ ...c, corr: { ...c.corr, vars: f(c.corr.vars) } }))} />
        </div>
      )}
      {cm && !cm.error && (
        <>
          <div className="flex flex-wrap justify-between items-center gap-3">
            <p className="text-sm text-slate-600">{t.methodUsed}: <span className="font-semibold text-blue-700">{cm.method === 'pearson' ? 'Pearson r' : 'Spearman rₛ'}</span> · * p &lt; .05, ** p &lt; .01, *** p &lt; .001</p>
            <CopyButton target={ref} label={t.copyTable} />
          </div>
          <div className="overflow-x-auto">
            <table ref={ref} className="text-sm border-collapse">
              <thead><tr><th className="p-2" />{cm.vars.map(v => <th key={v} className="p-2 font-semibold text-slate-700 whitespace-nowrap">{v}</th>)}</tr></thead>
              <tbody>
                {cm.vars.map((v, i) => (
                  <tr key={v}>
                    <th className="p-2 text-left font-semibold text-slate-700 whitespace-nowrap">{v}</th>
                    {cm.cells[i].map((c, j) => (
                      <td key={j} title={i === j ? '' : `${fmtP(c.p)}, n = ${c.n}`} className="p-0 border border-white">
                        <div className="w-20 h-14 flex flex-col items-center justify-center" style={{ background: fill(c.r), color: Math.abs(c.r) > 0.45 ? '#fff' : '#1e293b' }}>
                          <span className="font-semibold">{i === j ? '1' : `${nz(c.r)}${stars(c.p)}`}</span>
                          {i !== j && <span className="text-[10px] opacity-80">n = {c.n}</span>}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Sentence text={correlationSentence(cm, language)} />
        </>
      )}
    </Panel>
  );
}
