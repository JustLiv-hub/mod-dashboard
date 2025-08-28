// app/page.tsx
"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Home() {
  // Enter → GO
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") window.location.href = "/mod/login";
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#343a4a] text-white">
      {/* subtle top neon bloom */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(60%_35%_at_50%_0%,rgba(255,90,90,0.35),transparent_70%)]" />

      {/* Title */}
      <div className="pt-[clamp(5rem,10vh,12rem)] text-center">
        <h1 className="font-script neon-red text-[76px] sm:text-[110px] md:text-[138px] leading-[0.9]">
          Discord Mod
        </h1>
        <h2 className="font-script neon-red -mt-3 text-[64px] sm:text-[96px] md:text-[128px] leading-[0.9]">
          Dashboard
        </h2>
      </div>

      {/* ✅ GO button — centered, lifted above the image height */}
      <Link
        href="/mod/login"
        aria-label="Go to login"
        className="
          fixed left-1/2 -translate-x-1/2 z-50
          bottom-[380px] sm:bottom-[460px] md:bottom-[560px] lg:bottom-[640px]
          inline-flex items-center justify-center
          rounded-2xl px-14 py-5 text-3xl font-bold tracking-widest
          bg-[#c63b30] hover:bg-[#b83228] transition-colors
          ring-1 ring-white/20 shadow-[0_22px_70px_rgba(229,57,53,0.5)]
        "
      >
        GO
      </Link>

      {/* ✅ Kaylie — pinned to bottom-left */}
      <img
        src="/kaylie.png"
        alt="Kaylie"
        className="
          fixed left-6 bottom-6 z-40
          w-[340px] sm:w-[420px] md:w-[520px] lg:w-[600px]
          drop-shadow-[0_20px_50px_rgba(0,0,0,0.45)]
          select-none pointer-events-none
        "
      />
    </main>
  );
}
