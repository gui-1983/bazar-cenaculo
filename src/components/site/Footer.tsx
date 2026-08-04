import Link from "next/link";
import { Logo } from "./Logo";
import { getConfig } from "@/lib/queries";

export async function Footer() {
  const cfg = await getConfig();
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto max-w-[1120px] px-[22px] py-12">
        <div className="grid gap-8 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <div className="mb-3.5 flex items-center gap-3">
              <Logo size={38} />
              <span className="leading-tight">
                <b className="block font-display text-[15.5px] font-semibold">{cfg.nomeSite}</b>
                <span className="block text-[11.5px] text-muted">{cfg.instituicao}</span>
              </span>
            </div>
            <p className="max-w-[34ch] text-sm text-muted">
              Um catálogo mantido por voluntários. Cada reserva sustenta os projetos sociais da casa.
            </p>
          </div>
          <FootCol title="Navegar">
            <Link href="/produtos">Produtos</Link>
            <Link href="/institucional">Nossa história</Link>
            <Link href="/como-doar">Como doar</Link>
          </FootCol>
          <FootCol title="Contato">
            <a href={`https://wa.me/${cfg.whatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            {cfg.instagram && <a href={cfg.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>}
            <a href={`mailto:${cfg.email}`}>{cfg.email}</a>
          </FootCol>
          <FootCol title="Endereço">
            <span className="block py-1 text-sm text-muted">{cfg.endereco}</span>
            <span className="block py-1 text-sm text-muted">{cfg.horario}</span>
          </FootCol>
        </div>
        <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-line pt-5 text-[13px] text-muted">
          <span>© {new Date().getFullYear()} {cfg.instituicao}</span>
          <span>Feito com 💙 por voluntários</span>
        </div>
      </div>
    </footer>
  );
}

function FootCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h5 className="mb-3.5 text-xs font-semibold uppercase tracking-wider text-muted">{title}</h5>
      <div className="[&>a]:block [&>a]:py-1 [&>a]:text-sm [&>a]:text-muted [&>a:hover]:text-ink">
        {children}
      </div>
    </div>
  );
}
