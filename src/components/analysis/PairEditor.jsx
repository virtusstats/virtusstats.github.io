// Pick two columns and add them as a pair (used by the paired and the categorical tabs).
import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { Select } from './ui';

export default function PairEditor({ columns, pairs, onChange, labelA, labelB }) {
  const { t } = useLanguage();
  const [a, setA] = useState(''), [b, setB] = useState('');
  const exists = pairs.some(p => p.a === a && p.b === b);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={a} onChange={setA} options={columns} placeholder={labelA} />
        <Select value={b} onChange={setB} options={columns.filter(c => c !== a)} placeholder={labelB} />
        <button
          type="button"
          disabled={!a || !b || a === b || exists}
          onClick={() => { onChange([...pairs, { a, b }]); setA(''); setB(''); }}
          className="inline-flex items-center gap-1.5 bg-blue-700 disabled:bg-slate-300 text-white text-sm font-medium px-3 py-1.5 rounded-lg"
        ><Plus className="w-4 h-4" />{t.add}</button>
      </div>
      {pairs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pairs.map((p, i) => (
            <span key={`${p.a}|${p.b}`} className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-sm rounded-full pl-3 pr-1 py-1">
              {p.a} – {p.b}
              <button type="button" aria-label={t.remove} onClick={() => onChange(pairs.filter((_, j) => j !== i))} className="rounded-full p-0.5 hover:bg-slate-200"><X className="w-3.5 h-3.5" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
