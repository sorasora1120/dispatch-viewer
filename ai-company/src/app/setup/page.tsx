export default function Setup() {
  return (
    <main className="mx-auto max-w-lg px-5 py-16">
      <div className="text-xs tracking-[0.2em] text-accent">AI COMPANY OS</div>
      <h1 className="mt-2 text-2xl font-semibold">Setup needed</h1>
      <p className="mt-3 text-mute">
        Supabase is not connected yet. Set <code className="text-ink">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code className="text-ink">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in Vercel → Project → Settings → Environment Variables, then redeploy.
        See README.md.
      </p>
    </main>
  );
}
