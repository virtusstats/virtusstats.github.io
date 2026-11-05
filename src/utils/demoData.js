// Sample dataset for "Load demo": a small three-arm study with real effects, so every tab has something to show.
// Seeded, so the demo gives the same numbers every time.
export function demoData(n = 90) {
  let seed = 42;
  const rand = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  const normal = () => Math.sqrt(-2 * Math.log(rand() + 1e-12)) * Math.cos(2 * Math.PI * rand());
  const groups = ['Control', 'Placebo', 'Treatment'];
  const data = Array.from({ length: n }, (_, i) => {
    const group = groups[i % 3];
    const age = Math.round(45 + 12 * normal());
    const pre = +(60 + 8 * normal()).toFixed(1);
    const gain = { Control: 1, Placebo: 3, Treatment: 9 }[group] + 4 * normal();
    const post = +(pre + gain).toFixed(1);
    const smoker = rand() < 0.3 ? 'Yes' : 'No';
    const recovered = rand() < 1 / (1 + Math.exp(-(gain - 4) / 2)) ? 'Yes' : 'No';
    return {
      Group: group, Sex: rand() < 0.5 ? 'Female' : 'Male', Age: age, Pre: pre, Post: post,
      Satisfaction: Math.max(1, Math.min(5, Math.round(3 + gain / 6 + normal()))), Smoker: smoker, Recovered: recovered,
    };
  });
  data[7].Age = ''; data[33].Post = ''; data[61].Age = 112; // a few missing values and one outlier for the data quality tab
  return { headers: Object.keys(data[0]), data };
}
