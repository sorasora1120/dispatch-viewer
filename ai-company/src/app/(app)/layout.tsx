import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { SideNav, TabBar } from "@/components/nav";
import { ICON, Icon, Logo } from "@/components/icons";
import { signOut } from "./actions";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  const [{ data: profile }, { count: pending }] = await Promise.all([
    supabase.from("users").select("display_name").eq("id", user.id).maybeSingle(),
    supabase.from("approvals").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  const name = profile?.display_name || user.email?.split("@")[0] || "";
  const p = pending ?? 0;
  return (
    <div className="lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-[260px] shrink-0 flex-col border-r border-line bg-[#0a0c20]/80 px-4 py-7 lg:flex">
        <Link href="/" className="mb-9 flex flex-col items-center text-center">
          <Logo className="h-12 w-auto" />
          <div className="mt-3 text-[19px] font-bold tracking-tight">AI COMPANY OS</div>
          <div className="text-xs text-mute">Powered by AI Agents</div>
        </Link>
        <SideNav pendingApprovals={p} />
        <div className="mt-auto space-y-4">
          <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/25 to-transparent px-4 py-3.5">
            <div className="text-sm font-semibold">Free plan</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-ok">Database connected <Icon d={ICON.check} className="size-3.5" /></div>
          </div>
          <div className="flex items-center gap-3 border-t border-line px-1 pt-4">
            <span className="grid size-10 place-items-center rounded-full bg-panel2 text-sm font-semibold uppercase">{name.slice(0, 1)}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{name}</div>
              <div className="truncate text-xs text-dim">{user.email}</div>
            </div>
            <form action={signOut}><button className="text-xs text-mute hover:text-ink" title="Sign out">Sign out</button></form>
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line/60 bg-[#080a1c]/85 px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur lg:border-0 lg:bg-transparent lg:px-10 lg:pt-6 lg:backdrop-blur-none">
          <Link href="/" className="lg:hidden"><Logo className="h-7 w-auto" id="lg-m" /></Link>
          <form action="/tasks" className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-line bg-panel/80 px-3.5 py-2.5 lg:max-w-xl">
            <Icon d={ICON.search} className="size-5 text-mute" />
            <input name="q" placeholder="Search tasks..." className="min-w-0 flex-1 bg-transparent text-ink placeholder:text-dim focus:outline-none" />
            <input type="hidden" name="f" value="all" />
          </form>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/approvals" className="relative grid size-10 place-items-center rounded-xl text-ink hover:bg-panel2" aria-label={`${p} pending approvals`}>
              <Icon d={ICON.bell} className="size-[22px]" />
              {p > 0 && <span className="absolute right-1 top-1 grid size-[18px] place-items-center rounded-full bg-bad text-[10px] font-semibold text-white">{p}</span>}
            </Link>
            <Link href="/settings" className="grid size-10 place-items-center rounded-xl text-ink hover:bg-panel2 lg:hidden" aria-label="Settings"><Icon d={ICON.gear} className="size-5" /></Link>
            <span className="hidden items-center gap-2 rounded-xl border border-line bg-panel/80 px-3.5 py-2 text-sm sm:flex"><span className="size-2.5 rounded-full bg-ok" />Online</span>
          </div>
        </header>
        <main className="mx-auto max-w-[1240px] px-4 pb-28 pt-5 lg:px-10 lg:pb-12 lg:pt-4">{children}</main>
      </div>
      <TabBar pendingApprovals={p} />
    </div>
  );
}
