import Link from "next/link";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { getConfig } from "@/lib/queries";

const links = [
  { href: "/produtos", label: "Produtos" },
  { href: "/como-doar", label: "Como doar" },
  { href: "/institucional", label: "Nossa história" },
  { href: "/contato", label: "Contato" },
];

export async function Header() {
  const cfg = await getConfig();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-[66px] max-w-[1120px] items-center gap-5 px-[22px]">
        <Link href="/" className="mr-auto flex items-center gap-3">
          <Logo size={40} />
          <span className="leading-tight">
            <b className="block font-display text-[15.5px] font-semibold">{cfg.nomeSite}</b>
            <span className="block text-[11.5px] text-muted">{cfg.instituicao}</span>
          </span>
        </Link>
        <nav className="hidden gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href}
              className="rounded-[10px] px-3 py-2 text-[14.5px] font-medium text-muted transition-colors hover:bg-surface hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/produtos" aria-label="Buscar"
            className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white text-ink transition-all hover:-translate-y-0.5 hover:text-green">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
            </svg>
          </Link>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
