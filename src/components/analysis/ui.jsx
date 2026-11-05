// Small building blocks shared by the analysis tabs.
import React, { useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { fmtP } from '../../utils/apa';
import { ALPHA } from '../../utils/analyses';

/** Copy an element as HTML (keeps tables when pasted into Word) with a plain-text fallback. */
async function copyElement(el) {
  const html = el.outerHTML, text = el.innerText;
  try {
    await navigator.clipboard.write([new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([text], { type: 'text/plain' }),
    })]);
  } catch {
    const range = document.createRange();
    range.selectNode(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand('copy');
    sel.removeAllRanges();
  }
}

export function CopyButton({ target, label }) {
  const { t } = useLanguage();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => { if (target.current) { await copyElement(target.current); setDone(true); setTimeout(() => setDone(false), 1500); } }}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-lg px-2.5 py-1.5 bg-white transition-colors print:hidden"
    >
      {done ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {done ? t.copied : label || t.copy}
    </button>
  );
}

export function Panel({ title, desc, actions, children }) {
  return (
    <section className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
          {desc && <p className="text-slate-500 text-sm mt-1 max-w-3xl">{desc}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
      <div className="p-6 space-y-6">{children}</div>
    </section>
  );
}

/** An APA sentence the user can copy straight into a thesis. */
export function Sentence({ text }) {
  const { t } = useLanguage();
  const ref = useRef(null);
  if (!text) return null;
  return (
    <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 flex flex-col sm:flex-row gap-3 sm:items-start">
      <p ref={ref} className="text-sm text-slate-800 leading-relaxed flex-1">{text}</p>
      <CopyButton target={ref} label={t.copy} />
    </div>
  );
}

/** A p value; `assumption` marks normality / equal-variance checks, where p < .05 is a warning, not a finding. */
export function PBadge({ p, assumption = false }) {
  if (!isFinite(p)) return <span className="text-slate-400">–</span>;
  const hit = assumption ? 'font-semibold text-amber-600' : 'font-semibold text-emerald-700';
  return <span className={p < ALPHA ? hit : 'text-slate-600'}>{fmtP(p).replace('p ', '').replace('= ', '')}</span>;
}

export function Select({ value, onChange, options, placeholder, className = '' }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-full ${className}`}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map(o => (typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
    </select>
  );
}

export function Table({ head, rows, tableRef, caption }) {
  return (
    <div className="overflow-x-auto">
      <table ref={tableRef} className="w-full text-left text-sm text-slate-700 border-collapse">
        {caption && <caption className="text-left text-sm font-semibold text-slate-800 pb-2">{caption}</caption>}
        <thead>
          <tr className="border-b-2 border-slate-300">
            {head.map((h, i) => <th key={i} className="px-3 py-2 font-semibold whitespace-nowrap">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-100">
              {r.map((c, j) => <td key={j} className="px-3 py-2 whitespace-nowrap">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const Notice = ({ children }) => <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-4">{children}</p>;
