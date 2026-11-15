// Small line icons (24px grid). Agent icons sit on a gradient tile so each role is recognisable without relying on colour alone.
export const ICON = {
  dashboard: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  users: "M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM22 19v-1a4 4 0 0 0-3-3.9M16 3.1a3.5 3.5 0 0 1 0 6.8",
  tasks: "M4 4h16v16H4zM8 12l3 3 5-6",
  folder: "M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4",
  clock: "M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 8v4l3 2",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 15H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9.7 4.6V4.5a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.1a2 2 0 1 1 0 4z",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
  bell: "M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0",
  check: "M5 12l5 5L20 7",
  bolt: "M13 2L4 14h7l-1 8 9-12h-7z",
  plus: "M12 5v14M5 12h14",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  pulse: "M3 12h4l3-8 4 16 3-8h4",
  arrow: "M5 12h14M13 6l6 6-6 6",
  chevron: "M9 6l6 6-6 6",
  alert: "M12 8v5M12 16.5v.5M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z",
} as const;

export function Icon({ d, className = "size-[18px]", strokeWidth = 1.8 }: { d: string; className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

const AGENT: Record<string, { d: string; from: string; to: string }> = {
  ceo: { d: "M3 8l4 4 5-7 5 7 4-4-2 11H5zM5 21h14", from: "#f6c453", to: "#b7791f" },
  research: { d: "M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-6-6M7 10h6M10 7v6", from: "#60a5fa", to: "#1d4ed8" },
  marketing: { d: "M3 10v4l11 5V5zM14 8a4 4 0 0 1 0 8M18 6a8 8 0 0 1 0 12M6 14l1 5h3l-1-4", from: "#a78bfa", to: "#6d28d9" },
  product: { d: "M12 2l9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10", from: "#38bdf8", to: "#0e7490" },
  sales: { d: "M3 20h18M5 16l5-5 4 3 6-7M15 7h5v5", from: "#34d399", to: "#047857" },
  finance: { d: "M6 4l6 8 6-8M5 12h14M5 16h14M12 12v9", from: "#fbbf24", to: "#b45309" },
  creative: { d: "M12 3a9 9 0 0 0 0 18c1.7 0 2-1.3 1.2-2.4-.8-1.1-.3-2.6 1.1-2.6H17a4 4 0 0 0 4-4 9 9 0 0 0-9-9zM7.5 11.5h.01M10 7.5h.01M15 7.5h.01", from: "#f472b6", to: "#be185d" },
  operations: { d: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2", from: "#94a3b8", to: "#475569" },
  qc: { d: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4", from: "#818cf8", to: "#4338ca" },
};

export function AgentIcon({ slug, size = 40 }: { slug: string; size?: number }) {
  const a = AGENT[slug] ?? AGENT.operations;
  return (
    <span className="grid shrink-0 place-items-center rounded-full text-white shadow-lg" style={{ width: size, height: size, background: `radial-gradient(circle at 30% 25%, ${a.from}, ${a.to})` }}>
      <Icon d={a.d} className="size-[55%]" strokeWidth={1.9} />
    </span>
  );
}

export function Logo({ className = "h-9 w-auto", id = "lg" }: { className?: string; id?: string }) {
  return (
    <svg viewBox="0 0 64 32" className={className} aria-hidden>
      <defs><linearGradient id={id} x1="0" x2="1"><stop offset="0" stopColor="#7c5cff" /><stop offset="1" stopColor="#4f8cff" /></linearGradient></defs>
      <path d="M16 6c-6 0-10 4.5-10 10s4 10 10 10c8 0 14-20 32-20 6 0 10 4.5 10 10s-4 10-10 10C30 26 24 6 16 6z" fill="none" stroke={`url(#${id})`} strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
