"use client";
import { useEffect, useRef, useState } from "react";

// Two-series line chart (Created vs Completed per day). Colours validated for dark mode with the dataviz checker
// (blue #3a7bf0 / rose #d0607a: CVD and normal-vision separation pass). Identity is also given by the legend and the tooltip.
export const SERIES = [
  { key: "created", label: "Created", color: "#3a7bf0" },
  { key: "completed", label: "Completed", color: "#d0607a" },
] as const;

export function OverviewChart({ labels, created, completed }: { labels: string[]; created: number[]; completed: number[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(640);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(() => setW(Math.max(280, Math.round(el.clientWidth))));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  const H = W < 480 ? 220 : 240, L = 34, R = 14, T = 14, B = 30;
  const max = Math.max(4, ...created, ...completed);
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const x = (i: number) => L + (i * (W - L - R)) / Math.max(1, labels.length - 1);
  const y = (v: number) => T + (1 - v / top) * (H - T - B);
  const line = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const area = (vals: number[]) => `${line(vals)}L${x(vals.length - 1)},${y(0)}L${x(0)},${y(0)}Z`;
  const data = { created, completed };
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);

  return (
    <div>
      <div className="mb-2 flex justify-end gap-4 text-xs text-mute">
        {SERIES.map((s) => <span key={s.key} className="flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: s.color }} />{s.label}</span>)}
      </div>
      <div className="relative" ref={box}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Tasks created and completed per day, last 7 days" onMouseLeave={() => setHover(null)}>
          <defs>
            {SERIES.map((s) => (
              <linearGradient key={s.key} id={`g-${s.key}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor={s.color} stopOpacity=".28" /><stop offset="1" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#252a52" strokeWidth="1" />
              <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#9aa0c7">{t}</text>
            </g>
          ))}
          {labels.map((l, i) => <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#9aa0c7">{l}</text>)}
          {SERIES.map((s) => <path key={s.key + "a"} d={area(data[s.key])} fill={`url(#g-${s.key})`} />)}
          {SERIES.map((s) => <path key={s.key} d={line(data[s.key])} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" />)}
          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={T} y2={y(0)} stroke="#9aa0c7" strokeOpacity=".5" strokeDasharray="3 3" />}
          {SERIES.map((s) => data[s.key].map((v, i) => (
            <circle key={s.key + i} cx={x(i)} cy={y(v)} r={hover === i ? 5 : 4} fill={s.color} stroke="#10132b" strokeWidth="2" />
          )))}
          {labels.map((_, i) => (
            <rect key={"h" + i} x={x(i) - (W - L - R) / labels.length / 2} y={T} width={(W - L - R) / labels.length} height={H - T - B} fill="transparent"
              onMouseEnter={() => setHover(i)} onClick={() => setHover(i)} />
          ))}
        </svg>
        {hover !== null && (
          <div className="pointer-events-none absolute top-1 rounded-lg border border-line bg-[#0b0d22] px-3 py-2 text-xs shadow-xl"
            style={{ left: `${(x(hover) / W) * 100}%`, transform: `translateX(${hover > labels.length / 2 ? "-105%" : "5%"})` }}>
            <div className="mb-1 font-medium text-ink">{labels[hover]}</div>
            {SERIES.map((s) => <div key={s.key} className="flex items-center gap-1.5 text-mute"><span className="size-2 rounded-full" style={{ background: s.color }} />{s.label}<b className="ml-auto pl-3 text-ink tabular-nums">{data[s.key][hover]}</b></div>)}
          </div>
        )}
      </div>
      <table className="sr-only">
        <caption>Tasks per day</caption>
        <thead><tr><th>Day</th><th>Created</th><th>Completed</th></tr></thead>
        <tbody>{labels.map((l, i) => <tr key={i}><td>{l}</td><td>{created[i]}</td><td>{completed[i]}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

function niceStep(max: number) {
  const raw = max / 4;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  for (const m of [1, 2, 5, 10]) if (m * p >= raw) return m * p;
  return 10 * p;
}

/** Small decorative-free sparkline of a real series (no axes). */
export function Spark({ values, color }: { values: number[]; color: string }) {
  const W = 120, H = 36, max = Math.max(1, ...values);
  const pts = values.map((v, i) => `${(i * W) / Math.max(1, values.length - 1)},${H - 3 - (v / max) * (H - 8)}`);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-9 w-28" aria-hidden>
      <defs><linearGradient id={`sp${color.slice(1)}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".35" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path d={`M${pts.join("L")}L${W},${H}L0,${H}Z`} fill={`url(#sp${color.slice(1)})`} />
      <path d={`M${pts.join("L")}`} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
