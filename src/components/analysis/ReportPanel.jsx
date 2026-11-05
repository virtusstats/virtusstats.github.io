// The whole analysis as one APA-style document: download as Word or PDF, export to Excel, or copy.
import React, { useMemo, useRef } from 'react';
import { Download, FileText, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';
import jstat from 'jstat';
import { useLanguage } from '../../context/LanguageContext';
import { isCategoricalType, isNumericType, normality } from '../../utils/analyses';
import { correlationSentence, crosstabSentence, fix, fmtP, groupSentence, normalitySentence, nz, pairedSentence, regressionSentence, testName } from '../../utils/apa';
import { mean, sd } from '../../utils/inference';
import { CopyButton } from './ui';

const { jStat } = jstat;
const nums = (data, col) => data.map(r => r[col]).filter(v => v !== null && v !== undefined && v !== '' && !isNaN(Number(v))).map(Number);

function describeColumns(data, columnTypes) {
  return Object.keys(columnTypes).filter(c => isNumericType(columnTypes[c])).map(col => {
    const v = nums(data, col);
    return v.length ? {
      col, n: v.length, mean: mean(v), sd: v.length > 1 ? sd(v) : NaN, median: jStat.median(v),
      q1: jStat.percentile(v, 0.25), q3: jStat.percentile(v, 0.75), min: Math.min(...v), max: Math.max(...v), norm: normality(v),
    } : { col, n: 0 };
  });
}

function frequencies(data, columnTypes) {
  return Object.keys(columnTypes).filter(c => isCategoricalType(columnTypes[c])).map(col => {
    const counts = {};
    data.forEach(r => { const v = r[col]; if (v !== null && v !== undefined && v !== '') counts[String(v)] = (counts[String(v)] || 0) + 1; });
    const n = Object.values(counts).reduce((s, x) => s + x, 0);
    return { col, n, levels: Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 20) };
  });
}

// Inline styles so the tables survive Word, PDF and the clipboard.
const S = {
  table: { borderCollapse: 'collapse', margin: '8px 0 16px', fontSize: '10.5pt' },
  th: { borderTop: '1.5px solid #000', borderBottom: '1px solid #000', padding: '4px 10px', textAlign: 'left', fontWeight: 600 },
  td: { padding: '3px 10px' },
  caption: { textAlign: 'left', fontStyle: 'italic', padding: '0 0 4px', whiteSpace: 'nowrap' },
  h2: { fontSize: '14pt', margin: '22px 0 8px', color: '#123C69' },
  h3: { fontSize: '11.5pt', margin: '14px 0 6px' },
  p: { margin: '6px 0', lineHeight: 1.5 },
};
function T({ caption, head, rows }) {
  return (
    <table style={S.table}>
      {caption && <caption style={S.caption}>{caption}</caption>}
      <thead><tr>{head.map((h, i) => <th key={i} style={S.th}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i} style={i === rows.length - 1 ? { borderBottom: '1.5px solid #000' } : undefined}>{r.map((c, j) => <td key={j} style={S.td}>{c}</td>)}</tr>)}</tbody>
    </table>
  );
}

export default function ReportPanel({ data, columnTypes, config, results }) {
  const { t, language } = useLanguage();
  const ref = useRef(null);
  const desc = useMemo(() => describeColumns(results.clean, columnTypes), [results.clean, columnTypes]);
  const freq = useMemo(() => frequencies(results.clean, columnTypes), [results.clean, columnTypes]);
  const date = new Date().toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  let tableNo = 0;
  const cap = text => `${t.tableWord} ${++tableNo}. ${text}`;

  const sentences = [
    ...desc.map(d => normalitySentence(d.col, d.norm, language)),
    ...results.groups.map(c => groupSentence(c, language)),
    ...results.paired.map(c => pairedSentence(c, language)),
    ...results.crosstabs.map(c => crosstabSentence(c, language)),
    correlationSentence(results.correlation, language),
    regressionSentence(results.regression, language),
  ].filter(Boolean);

  const downloadWord = () => {
    const html = `<html><head><meta charset="utf-8"><title>Tabula</title><style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt}</style></head><body>${ref.current.innerHTML}</body></html>`;
    const url = URL.createObjectURL(new Blob(['﻿', html], { type: 'application/msword' }));
    Object.assign(document.createElement('a'), { href: url, download: 'Tabula_Rapor.doc' }).click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const downloadXlsx = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(desc.map(d => ({
      [t.varHeader]: d.col, n: d.n, [t.meanHeader]: d.mean, [t.stdDevHeader]: d.sd, [t.medianHeader]: d.median,
      Q1: d.q1, Q3: d.q3, Min: d.min, Max: d.max, [t.normTest]: d.norm?.test, 'W / JB': d.norm?.stat, p: d.norm?.p,
    }))), t.reportDescriptives.slice(0, 31));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([[t.apaSentences], ...sentences.map(s => [s])]), 'APA');
    XLSX.writeFile(wb, 'Tabula_Analysis_Report.xlsx');
  };

  const button = 'inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors';
  return (
    <section className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-start justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t.reportTitle}</h2>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">{t.reportDesc}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={downloadWord} className={`${button} bg-blue-700 hover:bg-blue-800 text-white`}><FileText className="w-4 h-4" />{t.downloadWord}</button>
          <button type="button" onClick={() => window.print()} className={`${button} bg-slate-800 hover:bg-slate-900 text-white`}><Printer className="w-4 h-4" />{t.downloadPdf}</button>
          <button type="button" onClick={downloadXlsx} className={`${button} border border-slate-300 hover:border-blue-400 text-slate-700`}><Download className="w-4 h-4" />Excel</button>
          <CopyButton target={ref} label={t.copyReport} />
        </div>
      </div>

      <div id="tabula-report" ref={ref} className="p-6 md:p-10 text-slate-900 overflow-x-auto" style={{ fontSize: '11pt' }}>
        <h1 style={{ fontSize: '18pt', margin: '0 0 4px', color: '#123C69' }}>{t.reportHeading}</h1>
        <p style={{ ...S.p, color: '#555' }}>{date} · {t.rowsWord}: {data.length} · {t.generatedBy}</p>
        {config.exclusions.length > 0 && <p style={S.p}>{t.excludedNote} ({config.exclusions.join(', ')}; {config.outlierMethod === 'z' ? t.methodZ : t.methodIqr})</p>}

        <h2 style={S.h2}>{t.reportDescriptives}</h2>
        {desc.length > 0 && (
          <T caption={cap(t.reportDescriptives)}
            head={[t.varHeader, 'n', t.meanHeader, t.stdDevHeader, t.medianHeader, 'Q1–Q3', 'Min–Max', t.normTest]}
            rows={desc.map(d => d.n ? [d.col, d.n, fix(d.mean), fix(d.sd), fix(d.median), `${fix(d.q1)}–${fix(d.q3)}`, `${fix(d.min)}–${fix(d.max)}`,
              d.norm ? `${d.norm.test === 'shapiroWilk' ? `W = ${nz(d.norm.stat, 3)}` : `JB = ${fix(d.norm.stat)}`}, ${fmtP(d.norm.p)}` : '–'] : [d.col, 0, '–', '–', '–', '–', '–', '–'])} />
        )}
        {desc.map(d => d.norm && <p key={d.col} style={S.p}>{normalitySentence(d.col, d.norm, language)}</p>)}
        {freq.map(f => (
          <T key={f.col} caption={cap(`${f.col}: ${t.frequencies}`)} head={[f.col, 'n', '%']}
            rows={f.levels.map(([k, n]) => [k, n, `${((n / f.n) * 100).toFixed(1)}`])} />
        ))}

        {results.groups.length > 0 && <h2 style={S.h2}>{t.groupsTitle} ({config.groupingVariable})</h2>}
        {results.groups.filter(c => !c.error).map(c => (
          <div key={c.col}>
            <h3 style={S.h3}>{c.col}: {testName(c.result.test, language)}</h3>
            <T caption={cap(`${c.col} × ${c.groupVar}`)} head={[t.groupHeader, 'n', t.meanHeader, t.stdDevHeader, t.medianHeader]}
              rows={c.names.map((n, i) => [n, c.result.groups[i].n, fix(c.result.groups[i].mean), fix(c.result.groups[i].sd), fix(c.result.groups[i].median)])} />
            {c.posthoc && <T caption={cap(`${c.col}: ${testName(c.posthoc.method, language)}`)} head={[t.comparison, t.diffHeader, c.posthoc.method === 'dunn' ? 'z' : 'q', 'p']}
              rows={c.posthoc.rows.map(p => [`${p.a} – ${p.b}`, fix(p.diff), fix(p.stat), fmtP(p.p).replace('p ', '').replace('= ', '')])} />}
            <p style={S.p}>{groupSentence(c, language)}</p>
          </div>
        ))}

        {results.paired.length > 0 && <h2 style={S.h2}>{t.pairedTitle}</h2>}
        {results.paired.filter(c => !c.error).map(c => <p key={`${c.a}|${c.b}`} style={S.p}>{pairedSentence(c, language)}</p>)}

        {results.crosstabs.length > 0 && <h2 style={S.h2}>{t.catTitle}</h2>}
        {results.crosstabs.filter(c => !c.error).map(c => (
          <div key={`${c.a}|${c.b}`}>
            <T caption={cap(`${c.a} × ${c.b}`)} head={[`${c.a} \\ ${c.b}`, ...c.colLabels]} rows={c.table.map((r, i) => [c.rowLabels[i], ...r])} />
            <p style={S.p}>{crosstabSentence(c, language)}</p>
          </div>
        ))}

        {results.correlation && !results.correlation.error && (
          <>
            <h2 style={S.h2}>{t.corrTitle}</h2>
            <T caption={cap(`${results.correlation.method === 'pearson' ? 'Pearson r' : 'Spearman rₛ'}`)} head={['', ...results.correlation.vars]}
              rows={results.correlation.vars.map((v, i) => [v, ...results.correlation.cells[i].map((c, j) => (j === i ? '1' : j < i ? `${nz(c.r)}${c.p < 0.001 ? '***' : c.p < 0.01 ? '**' : c.p < 0.05 ? '*' : ''}` : ''))])} />
            <p style={S.p}>{correlationSentence(results.correlation, language)}</p>
          </>
        )}

        {results.regression && !results.regression.error && (
          <>
            <h2 style={S.h2}>{t.regTitle}</h2>
            <T caption={cap(`${results.regression.y} ~ ${results.regression.xs.join(' + ')}`)}
              head={[t.term, 'b', 'SE', results.regression.kind === 'linear' ? 't' : 'z', 'p', ...(results.regression.kind === 'logistic' ? ['OR'] : [])]}
              rows={results.regression.coef.map((c, j) => [j ? results.regression.xs[j - 1] : t.intercept, fix(c.b, 3), fix(c.se, 3), fix(c.stat), fmtP(c.p).replace('p ', '').replace('= ', ''), ...(results.regression.kind === 'logistic' ? [fix(c.or, 3)] : [])])} />
            <p style={S.p}>{regressionSentence(results.regression, language)}</p>
          </>
        )}
      </div>
    </section>
  );
}
