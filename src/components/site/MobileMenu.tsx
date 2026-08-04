"use client";
import { useState } from "react";
import Link from "next/link";

const links = [
  { href: "/produtos", label: "Produtos" },
  { href: "/como-doar", label: "Como doar" },
  { href: "/institucional", label: "Nossa história" },
  { href: "/contato", label: "Contato" },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white text-ink transition-all hover:text-green"
      >
        {open ? (
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 top-[66px] z-30 bg-black/10" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 top-[66px] z-40 border-b border-line bg-white shadow-soft">
            <nav className="mx-auto flex max-w-[1120px] flex-col px-[22px] py-2">
              {links.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                  className="border-b border-line py-3.5 text-base font-semibold text-ink last:border-b-0">
                  {l.label}
                </Link>
              ))}
              <Link href="/admin" onClick={() => setOpen(false)}
                className="py-3.5 text-base font-semibold text-green">
                ⚙️ Painel do voluntário
              </Link>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
