// Show plain text with clickable https links (results written by the AI often contain links).
export function Linkify({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s)）]+)/g);
  return (
    <div className="whitespace-pre-wrap break-words text-[14.5px] leading-relaxed">
      {parts.map((p, i) => (/^https?:\/\//.test(p) ? <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="text-info underline">{p}</a> : <span key={i}>{p}</span>))}
    </div>
  );
}
