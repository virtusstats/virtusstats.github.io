import React, { useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { crosstabSentence, fix, stat } from '../../utils/apa';
import PairEditor from './PairEditor';
import { CopyButton, Notice, Panel, Sentence, Table } from './ui';

function CrosstabResult({ ct }) {
  const { t, language } = useLanguage();
  const ref = useRef(null);
  if (ct.error) return <Notice>{ct.a} × {ct.b}: {t[ct.error]}</Notice>;
  const rowT = ct.table.map(r => r.reduce((s, v) => s + v, 0));
  const rows = ct.table.map((r, i) => [
    <span className="font-medium">{ct.rowLabels[i]}</span>,
    ...r.map((v, j) => <span>{v} <span className="text-xs text-slate-400">({fix(ct.chi.expected[i][j], 1)})</span></span>),
    rowT[i],
  ]);
  const colT = ct.colLabels.map((_, j) => ct.table.reduce((s, r) => s + r[j], 0));
  rows.push([<span className="font-semibold">{t.total}</span>, ...colT, ct.chi.N]);
  return (
    <div className="space-y-3 border-t border-slate-100 pt-6 first:border-0 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold text-slate-800 text-lg">{ct.a} × {ct.b}</h3>
        <div className="text-sm text-slate-600">{stat(ct.chi)}{ct.fisher && <><span className="mx-2 text-slate-300">|</span>Fisher: {stat(ct.fisher)}</>}</div>
      </div>
      <div className="flex justify-between items-center gap-3"><p className="text-xs text-slate-500">{t.expectedNote}</p><CopyButton target={ref} label={t.copyTable} /></div>
      <Table tableRef={ref} caption={`${ct.a} × ${ct.b}`} head={[`${ct.a} \\ ${ct.b}`, ...ct.colLabels, t.total]} rows={rows} />
      <Sentence text={crosstabSentence(ct, language)} />
    </div>
  );
}

export default function CategoricalPanel({ results, config, setConfig, categorical }) {
  const { t } = useLanguage();
  return (
    <Panel title={t.catTitle} desc={t.catDesc}>
      {categorical.length < 2 ? <Notice>{t.needTwoCategorical}</Notice> : (
        <PairEditor columns={categorical} pairs={config.crosstabs} onChange={crosstabs => setConfig(c => ({ ...c, crosstabs }))} labelA={t.rowVar} labelB={t.colVar} />
      )}
      {results.crosstabs.map(ct => <CrosstabResult key={`${ct.a}|${ct.b}`} ct={ct} />)}
    </Panel>
  );
}
