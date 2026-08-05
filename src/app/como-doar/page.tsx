import type { Metadata } from "next";
import { Button, Eyebrow } from "@/components/ui";
import { linkDoacaoWhatsApp } from "@/lib/whatsapp";
import { getConfig } from "@/lib/queries";
import { config, contatosBazar } from "@/lib/config";

export const metadata: Metadata = {
  title: "Como Doar",
  description: "Veja o que aceitamos, horários e como doar itens para o Bazar Beneficente.",
};

export const revalidate = 60;

export default async function ComoDoar() {
  const cfg = await getConfig();
  return (
    <div className="mx-auto max-w-[1120px] px-[22px]">
      <section className="py-16 pb-2">
        <Eyebrow>Como doar</Eyebrow>
        <h1 className="mt-5 max-w-[16ch] font-display text-[clamp(30px,5vw,52px)] font-bold leading-[1.05] tracking-tight">
          Doar é simples. A gente cuida do resto.
        </h1>
        <p className="my-5 max-w-[54ch] text-[clamp(16px,2.1vw,19px)] text-muted">
          Você separa os itens e entrega no nosso endereço, nos horários de funcionamento. Itens em bom estado ganham uma
          segunda vida e viram apoio para quem precisa.
        </p>
        <Button href={linkDoacaoWhatsApp(cfg)} external variant="whatsapp" size="lg">Falar no WhatsApp</Button>
      </section>

      <section className="grid gap-4 py-11 md:grid-cols-2">
        <div className="rounded-xl2 bg-green-soft p-6">
          <div className="mb-2 font-mono text-sm font-bold text-green-600">✓ Aceitamos</div>
          <h3 className="mb-1.5 font-display text-lg font-semibold">Itens em bom estado</h3>
          <p className="text-[14.5px] text-muted">Móveis, roupas limpas, livros, utensílios de cozinha, decoração, brinquedos e eletrônicos funcionando.</p>
        </div>
        <div className="rounded-xl2 bg-vend-bg p-6">
          <div className="mb-2 font-mono text-sm font-bold text-vend">✕ Não aceitamos</div>
          <h3 className="mb-1.5 font-display text-lg font-semibold">Itens danificados</h3>
          <p className="text-[14.5px] text-muted">Produtos quebrados, sujos ou itens que precisem de conserto.</p>
        </div>
      </section>

      {/* Contatos oficiais do bazar (doações) */}
      <section className="py-6">
        <h2 className="mb-1 font-display text-[clamp(22px,3vw,28px)] font-semibold">Fale com a equipe do bazar</h2>
        <p className="mb-5 text-[15px] text-muted">Para doações, combine a entrega no centro com uma das voluntárias:</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {contatosBazar.map((c) => (
            <a key={c.nome} href={`https://wa.me/${c.whatsapp}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[#d3e3f2] hover:shadow-soft">
              <div>
                <b className="block font-display text-lg font-semibold">{c.nome}</b>
                <span className="text-[14.5px] text-muted">{c.exibir}</span>
              </div>
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[#25D366] text-white">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.15-1.7-.84-2-.94-.26-.1-.45-.15-.64.15-.19.28-.73.94-.9 1.13-.16.19-.33.21-.61.07-.3-.15-1.24-.46-2.36-1.46-.87-.78-1.46-1.74-1.63-2.03-.17-.29-.02-.44.13-.59.13-.13.29-.33.44-.5.13-.17.17-.29.26-.48.09-.19.05-.36-.02-.5-.08-.15-.64-1.55-.88-2.12-.23-.55-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.38s1.02 2.76 1.17 2.95c.15.19 2.02 3.08 4.9 4.32.68.29 1.22.47 1.63.6.69.22 1.31.19 1.8.11.55-.08 1.7-.69 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.55-.34z"/></svg>
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="py-6 pb-16">
        <div className="max-w-[560px] overflow-hidden rounded-2xl border border-line">
          <Row k="Dias e horários" v={cfg.horario} />
          <Row k="Endereço" v={cfg.endereco} />
          <Row k="E-mail" v={cfg.email} />
          <Row k="Instituição" v={config.instituicao} />
        </div>
      </section>
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-6 border-b border-line px-4 py-3 text-[14.5px] last:border-b-0">
      <span className="flex-none text-muted">{k}</span><b className="text-right font-semibold">{v}</b>
    </div>
  );
}
