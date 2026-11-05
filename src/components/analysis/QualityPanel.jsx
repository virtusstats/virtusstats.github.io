import React, { useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { isNumericType } from '../../utils/analyses';
import { CopyButton, Panel, Select, Table } from './ui';

export default function QualityPanel({ results, config, setConfig }) {
  const { t } = useLanguage();
  const ref = useRef(null);
  const toggle = col => setConfig(c => ({
    ...c, exclusions: c.exclusions.includes(col) ? c.exclusions.filter(x => x !== col) : [...c.exclusions, col],
  }));
  const rows = results.quality.map(q => [
    <span className="font-medium text-slate-900">{q.col}</span>,
    t[q.type] || q.type,
    `${q.missing} (${((q.missing / q.n) * 100).toFixed(1)}%)`,
    isNumericType(q.type) ? q.outliers.length : '–',
    isNumericType(q.type) && q.outliers.length
      ? <span className="text-xs text-slate-500">{q.outliers.slice(0, 6).map(o => +o.value.toFixed(3)).join(', ')}{q.outliers.length > 6 ? '…' : ''}</span>
      : '',
    isNumericType(q.type) && q.outliers.length
      ? <label className="inline-flex items-center gap-2 cursor-pointer"><input type="checkbox" className="accent-blue-700" checked={config.exclusions.includes(q.col)} onChange={() => toggle(q.col)} />{t.exclude}</label>
      : '',
  ]);
  return (
    <Panel
      title={t.qualityTitle}
      desc={t.qualityDesc}
      actions={<>
        <Select value={config.outlierMethod} onChange={v => setConfig(c => ({ ...c, outlierMethod: v }))} options={[{ value: 'iqr', label: t.methodIqr }, { value: 'z', label: t.methodZ }]} />
        <CopyButton target={ref} label={t.copyTable} />
      </>}
    >
      <Table tableRef={ref} head={[t.varHeader, t.typeHeader, t.missingHeader, t.outliersHeader, t.outlierValues, '']} rows={rows} />
      {config.exclusions.length > 0 && <p className="text-sm text-amber-700">{t.excludedNote} ({config.exclusions.join(', ')})</p>}
    </Panel>
  );
}
