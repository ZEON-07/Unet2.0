"use client";

import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--background)] py-6 px-4 sm:px-6 font-mono text-[10px] text-[var(--muted)] transition-colors duration-400">
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="relative w-5 h-5 shrink-0 rounded overflow-hidden border border-[var(--line)] bg-[var(--surface)] flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Logo"
              width={20}
              height={20}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-extrabold text-[var(--foreground)] tracking-tight">
            മഷി ഉണ്ടോ മാഷേ ? <span className="text-[var(--ink-blue)] font-normal">(Mashi Undo Mashe?)</span>
          </span>
          <span className="opacity-40">/</span>
          <span>ESTIMATION BENCH</span>
        </div>
        <div className="text-center sm:text-right max-w-xl text-[9px] opacity-70">
          മഷി ഉണ്ടോ മാഷേ ? provides approximate page-life predictions based on public product claims and handwriting parameters. Results are not manufacturer guarantees.
        </div>
      </div>
    </footer>
  );
}
