"use client";

export function Footer() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--background)] py-6 px-4 sm:px-6 font-mono text-[10px] text-[var(--muted)] transition-colors duration-400">
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-[var(--foreground)] uppercase tracking-tight">
            INKLIFE<span className="text-[var(--ink-blue)]">®</span> LAB
          </span>
          <span className="opacity-40">/</span>
          <span>ESTIMATION BENCH</span>
        </div>
        <div className="text-center sm:text-right max-w-xl text-[9px] opacity-70">
          InkLife provides approximate page-life predictions based on public product claims and handwriting parameters. Results are not manufacturer guarantees.
        </div>
      </div>
    </footer>
  );
}
