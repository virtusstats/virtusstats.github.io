import React, { useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { fix, groupSentence, testName, stat } from '../../utils/apa';
import { CopyButton, Notice, PBadge, Panel, Select, Sentence, Table } from './ui';

function GroupResult({ cmp }) {
  const { t, language } = useLanguage();
  const ref = useRef(null), postRef = useRef(null);
  if (cmp.error) return <div><h3 className="font-semibold text-slate-800 mb-2">{cmp.col}</h3><Notice>{t[cmp.error]}</Notice></div>;
  const r = cmp.result;
  const rows = cmp.names.map((n, i) => [
    n, r.groups[i].n, fix(r.groups[i].mean), fix(r.groups[i].sd), fix(r.groups[i].median),
    cmp.normality[i] ? <PBadge p={cmp.normality[i].p} assumption /> : '–',
  ]);
  return (
    <div className="space-y-3 border-t border-slate-100 pt-6 first:border-0 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold text-slate-800 text-lg">{cmp.col}</h3>
        <div className="text-sm text-slate-600">
          {t.testUsed}: <span className="font-semibold text-blue-700">{testName(r.test, language)}</span>
          <span className="mx-2 text-slate-300">|</span>{stat(r)}
          <span className="mx-2 text-slate-300">|</span>Levene <PBadge p={cmp.levene.p} assumption />
        </div>
      </div>
      <div className="flex justify-end"><CopyButton target={ref} label={t.copyTable} /></div>
      <Table tableRef={ref} caption={`${cmp.col} × ${cmp.groupVar}`} head={[t.groupHeader, 'n', t.meanHeader, t.stdDevHeader, t.medianHeader, `Shapiro-Wilk p`]} rows={rows} />
      {cmp.posthoc && (
        <>
          <div className="flex justify-between items-center"><h4 className="font-semibold text-slate-700">{t.posthocTitle}: {testName(cmp.posthoc.method, language)}</h4><CopyButton target={postRef} label={t.copyTable} /></div>
          <Table tableRef={postRef} head={[t.comparison, t.diffHeader, cmp.posthoc.method === 'dunn' ? 'z' : 'q', 'p']}
            rows={cmp.posthoc.rows.map(p => [`${p.a} – ${p.b}`, fix(p.diff), fix(p.stat), <PBadge p={p.p} />])} />
        </>
      )}
      <Sentence text={groupSentence(cmp, language)} />
    </div>
  );
}

export default function GroupsPanel({ results, config, setConfig, categorical }) {
  const { t } = useLanguage();
  return (
    <Panel
      title={t.groupsTitle}
      desc={t.groupsDesc}
      actions={<Select value={config.groupingVariable} onChange={v => setConfig(c => ({ ...c, groupingVariable: v }))} options={categorical} placeholder={t.pickGroupingShort} />}
    >
      {!config.groupingVariable ? <Notice>{categorical.length ? t.pickGrouping : t.needCategorical}</Notice>
        : results.groups.length === 0 ? <Notice>{t.needNumeric}</Notice>
          : results.groups.map(cmp => <GroupResult key={cmp.col} cmp={cmp} />)}
    </Panel>
  );
}
