import { getUser } from "@/lib/supabase/server";
import { ErrorBox, PageHeader, Panel, btnCls, btnGhostCls, inputCls } from "@/components/ui";
import { signOut, updateDisplayName } from "../actions";

export default async function Settings({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { error, saved } = await searchParams;
  const { supabase, user } = await getUser();
  const { data: profile } = await supabase.from("users").select("display_name,created_at").eq("id", user!.id).maybeSingle();
  return (
    <>
      <PageHeader title="Settings" />
      {error && <ErrorBox message={error} />}
      {saved && <div className="mb-4 rounded-lg border border-ok/30 bg-ok/10 px-4 py-3 text-sm text-ok">Saved</div>}
      <Panel title="Profile">
        <form action={updateDisplayName} className="flex flex-col gap-3 sm:flex-row">
          <input name="display_name" defaultValue={profile?.display_name ?? ""} maxLength={60} placeholder="Display name" className={inputCls} />
          <button className={btnCls}>Save</button>
        </form>
        <p className="mt-3 text-xs text-dim">{user!.email}</p>
      </Panel>
      <Panel title="Integrations" className="mt-6">
        <p className="text-sm text-mute">Not connected yet. Gmail, Calendar, Drive, Notion, Shopify and SNS come in later phases. Nothing is sent outside without an approval.</p>
      </Panel>
      <Panel title="Session" className="mt-6">
        <form action={signOut}><button className={btnGhostCls}>Sign out</button></form>
      </Panel>
    </>
  );
}
