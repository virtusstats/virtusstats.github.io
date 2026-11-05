// Toggle a set of columns on and off.
const toggle = (list, o) => (list.includes(o) ? list.filter(x => x !== o) : [...list, o]);
import React from 'react';

/** `onChange` receives an updater (list => new list), so parents can apply it to the latest state. */
export default function Chips({ options, selected, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => {
        const on = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(list => toggle(list, o))}
            className={`text-sm rounded-full px-3 py-1 border transition-colors ${on ? 'bg-blue-700 border-blue-700 text-white' : 'bg-white border-slate-300 text-slate-600 hover:border-blue-400'}`}
          >{o}</button>
        );
      })}
    </div>
  );
}
