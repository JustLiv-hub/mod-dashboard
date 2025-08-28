// app/mod/layout.tsx
import type { Metadata } from "next";
import "../globals.css";
import { logout } from "./login/actions";

export const metadata: Metadata = { title: "Mod Dashboard" };

export default function ModLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-700 text-white">
      {/* top band header */}
      <header className="sticky top-0 z-30 bg-brand-700/90 backdrop-blur border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* 🔹 Lobster font, white */}
          <h1 className="font-script text-white text-3xl sm:text-4xl">
            Mod Dashboard
          </h1>

          {/* server action logout */}
          <form action={logout}>
            <button className="rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 px-4 py-2 text-sm">
              Log out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
