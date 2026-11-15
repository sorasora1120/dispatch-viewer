"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ICON, Icon } from "./icons";

export const NAV = [
  { href: "/", label: "Dashboard", icon: ICON.dashboard },
  { href: "/agents", label: "AI Employees", icon: ICON.users },
  { href: "/tasks", label: "Tasks", icon: ICON.tasks },
  { href: "/projects", label: "Projects", icon: ICON.folder },
  { href: "/approvals", label: "Approvals", icon: ICON.shield },
  { href: "/activity", label: "Activity Logs", icon: ICON.clock },
  { href: "/settings", label: "Settings", icon: ICON.gear },
];

const isOn = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));

export function SideNav({ pendingApprovals }: { pendingApprovals: number }) {
  const path = usePathname();
  return (
    <nav className="flex flex-col gap-1.5">
      {NAV.map((n) => {
        const on = isOn(path, n.href);
        return (
          <Link key={n.href} href={n.href}
            className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-[15px] transition-colors ${on ? "border border-accent/50 bg-gradient-to-r from-accent/70 to-accent/25 text-white shadow-[0_8px_24px_rgba(108,92,255,.3)]" : "border border-transparent text-mute hover:bg-panel2/60 hover:text-ink"}`}>
            <Icon d={n.icon} className="size-5" />
            <span className="flex-1">{n.label}</span>
            {n.href === "/approvals" && pendingApprovals > 0 && <span className="grid size-6 place-items-center rounded-full bg-bad text-[12px] font-semibold text-white">{pendingApprovals}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function TabBar({ pendingApprovals }: { pendingApprovals: number }) {
  const path = usePathname();
  const items = NAV.filter((n) => ["/", "/agents", "/tasks", "/approvals", "/activity"].includes(n.href));
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-[#0b0d22]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      {items.map((n) => {
        const on = isOn(path, n.href);
        return (
          <Link key={n.href} href={n.href} className={`relative flex flex-col items-center gap-1 py-2.5 text-[10.5px] ${on ? "text-white" : "text-dim"}`}>
            <span className={`grid h-8 w-12 place-items-center rounded-xl ${on ? "bg-gradient-to-r from-accent/80 to-accent2/60" : ""}`}><Icon d={n.icon} className="size-5" /></span>
            {n.label.replace("AI Employees", "Agents").replace("Activity Logs", "Logs")}
            {n.href === "/approvals" && pendingApprovals > 0 && <span className="absolute right-[18%] top-1 grid size-4 place-items-center rounded-full bg-bad text-[9px] font-semibold text-white">{pendingApprovals}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
