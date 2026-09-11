import Link from "next/link";
import { PenLine, Globe, MessageCircle, Heart } from "lucide-react";

const FOOTER_LINKS = {
  Product: [
    { label: "Estimate Ink", href: "/#estimate" },
    { label: "History", href: "/history" },
    { label: "How It Works", href: "/about" },
  ],
  Resources: [
    { label: "API Docs", href: "#" },
    { label: "Pen Database", href: "#" },
    { label: "FAQ", href: "#" },
  ],
  Legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="relative z-10 bg-ink-navy text-white/80 mt-auto">
      {/* Top border gradient */}
      <div className="h-px bg-gradient-to-r from-transparent via-ink-mint/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* ─── Brand column ─────────────────────────────────── */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-ink-blue to-ink-mint">
                <PenLine className="w-5 h-5 text-white" strokeWidth={2.2} />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Ink<span className="text-ink-mint">Life</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-white/50 max-w-xs">
              Rate the visible ink. We&apos;ll estimate the rest. A playful
              tool for stationery lovers who want to know how many pages their
              pen has left.
            </p>

            {/* Social */}
            <div className="flex gap-3 mt-6">
              {[
                { Icon: Globe, label: "GitHub" },
                { Icon: MessageCircle, label: "Twitter" },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/40 hover:text-white/80"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* ─── Link columns ─────────────────────────────────── */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">
                {heading}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/50 hover:text-ink-mint transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Bottom bar ──────────────────────────────────────── */}
      <div className="border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
          <p>© {new Date().getFullYear()} InkLife. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-ink-mint/60 fill-ink-mint/60" /> ink &amp; pixels
          </p>
        </div>
      </div>
    </footer>
  );
}
