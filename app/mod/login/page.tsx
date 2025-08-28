'use client';

import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { authenticate } from './actions';

type AuthResult = { success: boolean; error?: string };

const initialState: AuthResult = { success: false, error: '' };

export default function LoginPage() {
  const [show, setShow] = useState(false);

  // call the server action and capture result
  const [state, formAction, pending] = useActionState(
    async (_prev: AuthResult, formData: FormData): Promise<AuthResult> => {
      const res = await authenticate(formData);
      return res;
    },
    initialState
  );

  // on success, go to /mod (middleware will also allow through after cookie is set)
  useEffect(() => {
    if (state?.success) {
      window.location.href = '/mod';
    }
  }, [state]);

  return (
    <main className="relative min-h-screen bg-[#343a4a] text-white">
      {/* top glow, same as lander */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_35%_at_50%_0%,rgba(255,90,90,0.35),transparent_70%)]" />

      {/* Title */}
      <div className="pt-[clamp(5rem,10vh,12rem)] text-center">
        <h1 className="font-script neon-red text-[56px] sm:text-[84px] md:text-[108px] leading-[0.9]">
          Discord Mod
        </h1>
        <h2 className="font-script neon-red -mt-2 text-[48px] sm:text-[72px] md:text-[92px] leading-[0.9]">
          Dashboard
        </h2>
      </div>

      {/* Form Card */}
      <div className="mx-auto mt-12 max-w-md px-4">
        <form action={formAction} className="space-y-5 text-center">
          {/* label + input + show/hide */}
          <div className="text-left space-y-2">
            <label htmlFor="password" className="block text-sm font-medium opacity-90">
              Enter Password
            </label>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={show ? 'text' : 'password'}
                required
                autoFocus
                disabled={pending}
                className="w-full rounded-2xl bg-white/10 border border-white/15 px-4 py-3 text-base placeholder:text-white/50
                           focus:outline-none focus:ring-2 focus:ring-white/30"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-3 py-1 text-sm bg-white/10 border border-white/15 hover:bg-white/20"
              >
                {show ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* GO button */}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center rounded-2xl
                       px-10 py-3 text-xl font-bold tracking-widest
                       bg-[#c63b30] hover:bg-[#b83228] transition-colors
                       ring-1 ring-white/20 shadow-[0_18px_50px_rgba(229,57,53,0.45)]
                       disabled:opacity-60"
          >
            {pending ? 'GO…' : 'GO'}
          </button>

          {/* helper + error */}
          <p className="text-xs opacity-70">Authorized staff only.</p>
          {state?.error ? (
            <p className="text-sm text-red-300">{state.error}</p>
          ) : null}

          {/* Optional: back to splash */}
          <div className="pt-2">
            <Link href="/" className="text-xs underline opacity-70 hover:opacity-100">
              Back to home
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
