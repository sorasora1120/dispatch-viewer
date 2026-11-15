"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV = [
  { href: "/", label: "Dashboard", icon: "M3 13h8V3H3zm10 8h8V11h-8zM3 21h8v-6H3zm10-18v6h8V3z" },
  { href: "/agents", label: "AI Employees", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0" },
  { href: "/tasks", label: "Tasks", icon: "M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" },
  { href: "/projects", label: "Projects", icon: "M3 7h6l2 2h10v10H3z" },
  { href: "/approvals", label: "Approvals", icon: "M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7zM9 12l2 2 4-4" },
  { href: "/activity", label: "Activity Logs", icon: "M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" },
  { href: "/settings", label: "Settings", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 15H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9.7 4.6V4.5a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.1a2 2 0 1 1 0 4z" },
];

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export function SideNav({ pendingApprovals }: { pendingApprovals: number }) {
  const path = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map((n) => {
        const on = n.href === "/" ? path === "/" : path.startsWith(n.href);
        return (
          <Link key={n.href} href={n.href} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${on ? "bg-panel2 text-ink" : "text-mute hover:text-ink"}`}>
            <Icon d={n.icon} />
            <span className="flex-1">{n.label}</span>
            {n.href === "/approvals" && pendingApprovals > 0 && <span className="rounded-md bg-accent/15 px-1.5 text-[11px] font-semibold text-accent">{pendingApprovals}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function TabBar({ pendingApprovals }: { pendingApprovals: number }) {
  const path = usePathname();
  const items = NAV.filter((n) => ["/", "/agents", "/tasks", "/approvals", "/settings"].includes(n.href));
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] lg:hidden">
      {items.map((n) => {
        const on = n.href === "/" ? path === "/" : path.startsWith(n.href);
        return (
          <Link key={n.href} href={n.href} className={`relative flex flex-col items-center gap-1 py-2.5 text-[10.5px] ${on ? "text-ink" : "text-dim"}`}>
            <Icon d={n.icon} />
            {n.label.replace("AI Employees", "Agents")}
            {n.href === "/approvals" && pendingApprovals > 0 && <span className="absolute right-[22%] top-1.5 size-2 rounded-full bg-accent" />}
          </Link>
        );
      })}
    </nav>
  );
}
