// Wordmark: Bricolage Display 800, the last "i" is dotless with a square accent dot
// (names without an "i" end in the square). Same construction as kesit / eğleniyoruzbiz.
export default function Wordmark({ text, className = '' }) {
  const at = text.lastIndexOf('i');
  const dot = <span className="absolute left-1/2 top-[0.02em] size-[0.2em] -translate-x-1/2 rounded-[0.04em] bg-accent" />;
  return (
    <span role="img" aria-label={text}
      className={`inline-flex items-end whitespace-pre font-display font-extrabold leading-none tracking-[-0.035em] ${className}`}>
      {at < 0 ? (
        <>
          <span aria-hidden="true">{text}</span>
          <span aria-hidden="true" className="mb-[0.02em] ml-[0.04em] inline-block size-[0.2em] rounded-[0.04em] bg-accent" />
        </>
      ) : (
        <>
          <span aria-hidden="true">{text.slice(0, at)}</span>
          <span aria-hidden="true" className="relative">ı{dot}</span>
          <span aria-hidden="true">{text.slice(at + 1)}</span>
        </>
      )}
    </span>
  );
}
