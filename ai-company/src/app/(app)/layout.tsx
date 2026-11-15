import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { SideNav, TabBar } from "@/components/nav";
import { signOut } from "./actions";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await getUser();
  if (!user) redirect("/login");
  const [{ data: profile }, { count: pending }] = await Promise.all([
    supabase.from("users").select("display_name").eq("id", user.id).maybeSingle(),
    supabase.from("approvals").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  const name = profile?.display_name || user.email || "";
  return (
    <div className="lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line px-3 py-5 lg:flex">
        <div className="mb-6 px-3">
          <div className="text-[11px] tracking-[0.22em] text-accent">AI COMPANY</div>
          <div className="text-[15px] font-semibold">Operating System</div>
        </div>
        <SideNav pendingApprovals={pending ?? 0} />
        <div className="mt-auto border-t border-line px-3 pt-4">
          <div className="truncate text-sm">{name}</div>
          <div className="truncate text-xs text-dim">{user.email}</div>
          <form action={signOut}><button className="mt-3 text-xs text-mute hover:text-ink">Sign out</button></form>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-bg/95 px-5 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] lg:hidden">
          <div className="text-[13px] font-semibold tracking-[0.16em] text-accent">AI COMPANY</div>
          <div className="truncate text-xs text-mute">{name}</div>
        </header>
        <main className="mx-auto max-w-6xl px-5 pb-28 pt-6 lg:px-10 lg:pb-12 lg:pt-10">{children}</main>
      </div>
      <TabBar pendingApprovals={pending ?? 0} />
    </div>
  );
}
