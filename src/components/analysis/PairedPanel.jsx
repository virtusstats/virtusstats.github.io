import React, { useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { fix, pairedSentence, stat, testName } from '../../utils/apa';
import PairEditor from './PairEditor';
import { CopyButton, Notice, PBadge, Panel, Sentence, Table } from './ui';

function PairedResult({ cmp }) {
  const { t, language } = useLanguage();
  const ref = useRef(null);
  if (cmp.error) return <Notice>{cmp.a} – {cmp.b}: {t[cmp.error]}</Notice>;
  const r = cmp.result;
  return (
    <div className="space-y-3 border-t border-slate-100 pt-6 first:border-0 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold text-slate-800 text-lg">{cmp.a} – {cmp.b}</h3>
        <div className="text-sm text-slate-600">
          {t.testUsed}: <span className="font-semibold text-blue-700">{testName(r.test, language)}</span>
          <span className="mx-2 text-slate-300">|</span>{stat(r)}
          <span className="mx-2 text-slate-300">|</span>{t.diffNormality} <PBadge p={cmp.normality?.p} assumption />
        </div>
      </div>
      <div className="flex justify-end"><CopyButton target={ref} label={t.copyTable} /></div>
      <Table tableRef={ref} head={[t.varHeader, 'n', t.meanHeader, t.stdDevHeader, t.medianHeader]}
        rows={[cmp.a, cmp.b].map((n, i) => [n, r.groups[i].n, fix(r.groups[i].mean), fix(r.groups[i].sd), fix(r.groups[i].median)])} />
      {r.zeros > 0 && <p className="text-xs text-slate-500">{t.zerosDropped.replace('{n}', r.zeros)}</p>}
      <Sentence text={pairedSentence(cmp, language)} />
    </div>
  );
}

export default function PairedPanel({ results, config, setConfig, numeric }) {
  const { t } = useLanguage();
  return (
    <Panel title={t.pairedTitle} desc={t.pairedDesc}>
      {numeric.length < 2 ? <Notice>{t.needTwoNumeric}</Notice> : (
        <PairEditor columns={numeric} pairs={config.pairs} onChange={pairs => setConfig(c => ({ ...c, pairs }))} labelA={t.firstMeasure} labelB={t.secondMeasure} />
      )}
      {results.paired.map(cmp => <PairedResult key={`${cmp.a}|${cmp.b}`} cmp={cmp} />)}
    </Panel>
  );
}
