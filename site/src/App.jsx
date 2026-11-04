import Wordmark from './Wordmark.jsx';
import c from './content.js';

const t = c.lang === 'tr'
  ? { features: 'Neler yapar', how: 'Nasıl çalışır', run: 'Çalıştır', stack: 'Altyapı', source: 'Kaynak kod', top: 'Başa dön' }
  : { features: 'What it does', how: 'How it works', run: 'Run it', stack: 'Built with', source: 'Source code', top: 'Back to top' };

function Section({ id, title, children, tinted }) {
  return (
    <section id={id} className={`scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24 ${tinted ? 'bg-soft' : ''}`}>
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-10 font-display text-3xl font-extrabold tracking-[-0.03em] text-primary dark:text-ink sm:text-4xl">{title}</h2>
        {children}
      </div>
    </section>
  );
}

export default function App() {
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-line bg-canvas/85 backdrop-blur">
        <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <a href="#top" aria-label={t.top} className="text-2xl text-primary dark:text-ink"><Wordmark text={c.wordmark} /></a>
          <div className="hidden gap-6 text-sm font-semibold text-muted sm:flex">
            <a className="hover:text-ink" href="#features">{t.features}</a>
            <a className="hover:text-ink" href="#how">{t.how}</a>
            <a className="hover:text-ink" href="#run">{t.run}</a>
          </div>
        </nav>
      </header>

      <main id="top">
        <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-[3rem] bg-accent/20 blur-3xl" />
          <div className="relative mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-[1.4fr_1fr]">
            <div className="min-w-0">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-sm font-semibold text-muted">
                <span className="size-2 rounded-[2px] bg-accent" />{c.badge}
              </p>
              <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.035em] text-balance sm:text-6xl">{c.tagline}</h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted text-pretty">{c.description}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                {c.ctas.map((b, i) => (
                  <a key={b.href} href={b.href}
                    className={i === 0
                      ? 'rounded-xl bg-primary px-5 py-3 font-semibold text-white shadow-sm transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
                      : 'rounded-xl border border-line px-5 py-3 font-semibold transition hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'}>
                    {b.label}
                  </a>
                ))}
              </div>
            </div>
            <div className="min-w-0 rounded-[2rem] bg-primary p-7 shadow-xl sm:p-14">
              <Wordmark text={c.wordmark} className="text-4xl text-white sm:text-6xl" />
              <ul className="mt-8 space-y-3 text-white/85">
                {c.highlights.map((h) => (
                  <li key={h} className="flex gap-3"><span className="mt-2 size-2 shrink-0 rounded-[2px] bg-accent" />{h}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <Section id="features" title={t.features} tinted>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {c.features.map((f) => (
              <article key={f.title} className="rounded-2xl border border-line bg-canvas p-6">
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{f.text}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section id="how" title={t.how}>
          <ol className="grid gap-8 md:grid-cols-3">
            {c.steps.map((s, i) => (
              <li key={s.title}>
                <span className="font-display text-5xl font-extrabold text-accent">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="run" title={t.run} tinted>
          <div className="grid gap-8 md:grid-cols-[1.3fr_1fr]">
            <pre className="min-w-0 overflow-x-auto rounded-2xl bg-[#16171d] p-6 text-sm leading-relaxed text-[#e6e6ee]"><code>{c.run}</code></pre>
            <div className="min-w-0">
              <h3 className="mb-4 font-semibold text-muted">{t.stack}</h3>
              <ul className="flex flex-wrap gap-2">
                {c.stack.map((s) => <li key={s} className="rounded-lg border border-line bg-canvas px-3 py-1.5 text-sm font-semibold">{s}</li>)}
              </ul>
              {c.note && <p className="mt-6 leading-relaxed text-muted">{c.note}</p>}
            </div>
          </div>
        </Section>
      </main>

      <footer className="border-t border-line px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 text-sm text-muted">
          <span className="text-xl text-primary dark:text-ink"><Wordmark text={c.wordmark} /></span>
          <a className="font-semibold hover:text-ink" href={c.repo}>{t.source} ↗</a>
          <span>© {new Date().getFullYear()} Hasan Ali Özkan</span>
        </div>
      </footer>
    </>
  );
}
