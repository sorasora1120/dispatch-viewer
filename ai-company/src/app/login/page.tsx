import { signIn } from "./actions";
import { ErrorBox, btnCls, inputCls } from "@/components/ui";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="flex min-h-dvh items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="text-xs tracking-[0.2em] text-accent">AI COMPANY OS</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-mute">Owner console</p>
        </div>
        {error && <ErrorBox message={error} />}
        <form action={signIn} className="space-y-3">
          <input name="email" type="email" autoComplete="email" required placeholder="Email" className={inputCls} />
          <input name="password" type="password" autoComplete="current-password" required minLength={8} placeholder="Password" className={inputCls} />
          <button className={`${btnCls} w-full py-2.5`}>Sign in</button>
        </form>
      </div>
    </main>
  );
}
