// Save / share an analysis: the column types and the config, never the data.
const TYPES = ['nominal', 'ordinal', 'interval', 'ratio'];

const toB64 = s => { let bin = ''; new TextEncoder().encode(s).forEach(b => { bin += String.fromCharCode(b); }); return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const fromB64 = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)));

export const serialize = (columnTypes, config) => JSON.stringify({ app: 'tabula', v: 1, columnTypes, config });

/** Parse a saved analysis (file text or link payload). Returns null for anything that is not one. */
export function parseShare(text) {
  try {
    const obj = JSON.parse(text);
    if (!obj || obj.app !== 'tabula' || typeof obj.columnTypes !== 'object' || !obj.columnTypes) return null;
    const columnTypes = Object.fromEntries(Object.entries(obj.columnTypes).filter(([, v]) => TYPES.includes(v)));
    return { columnTypes, config: obj.config };
  } catch {
    return null;
  }
}

export const shareUrl = (columnTypes, config) =>
  `${location.origin}${location.pathname}#a=${toB64(serialize(columnTypes, config))}`;

export function readShareFromHash() {
  const m = location.hash.match(/[#&]a=([^&]+)/);
  if (!m) return null;
  try { return parseShare(fromB64(m[1])); } catch { return null; }
}

export function downloadAnalysis(columnTypes, config) {
  const url = URL.createObjectURL(new Blob([serialize(columnTypes, config)], { type: 'application/json' }));
  Object.assign(document.createElement('a'), { href: url, download: 'tabula-analysis.json' }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
