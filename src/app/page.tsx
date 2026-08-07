import Link from "next/link";
import { getProdutos, getCategorias, getConfig } from "@/lib/queries";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Button } from "@/components/ui";

export const revalidate = 0; // sempre buscar dados frescos (produto novo aparece na hora)

export default async function Home() {
  const [destaques, novos, categorias, todos, cfg] = await Promise.all([
    getProdutos({ destaque: true, limit: 4 }),
    getProdutos({ limit: 4 }),
    getCategorias(),
    getProdutos(),
    getConfig(),
  ]);
  const disponiveis = todos.filter((p) => p.status === "disponivel").length;

  return (
    <div>
      {/* HERO — duas colunas sobre faixa suave */}
      <div className="border-b border-line bg-gradient-to-b from-[#eaf1f7] via-[#f2f6f9] to-white">
        <div className="mx-auto grid max-w-[1120px] items-center gap-12 px-[22px] py-16 md:grid-cols-[1.02fr_.98fr] md:py-[74px]">
          <div>
            <h1 className="font-display text-[clamp(38px,5.2vw,62px)] font-bold leading-[1.03] tracking-tight">
              Um bazar que transforma doações em cuidado
            </h1>
            <p className="my-6 max-w-[46ch] text-[clamp(16px,1.5vw,18.5px)] text-muted">
              {cfg.descricao} Você escolhe aqui, reserva pelo WhatsApp e retira presencialmente.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button href="/produtos" size="lg">Ver produtos disponíveis →</Button>
              <Button href="/como-doar" size="lg" variant="outline">Quero doar</Button>
            </div>
            <p className="mt-7 text-sm text-muted">
              <b className="font-display font-bold text-ink">{disponiveis}</b> itens disponíveis agora
              &nbsp;·&nbsp; <b className="font-display font-bold text-ink">100%</b> revertido à casa
            </p>
          </div>
          <div className="overflow-hidden rounded-3xl bg-surface2 shadow-[0_34px_60px_-26px_rgba(28,58,96,.42)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cfg.heroUrl || "/bazar-evento.jpeg"}
              alt="Convite para o Bazar Beneficente do Cenáculo Espírita Thiago Maior"
              className="aspect-[4/5] w-full object-cover"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1120px] px-[22px]">
        {/* VALORES */}
        <section className="grid gap-5 py-14 md:grid-cols-3">
          <Feature title="Solidariedade que circula" desc="Cada item doado se transforma em recurso para as ações de assistência do Cenáculo.">
            <path d="M11 14 8.5 11.5a2 2 0 0 0-2.8 2.8L11 19.5l6-3 3-4a2 2 0 0 0-3-2.6l-2 2" />
            <path d="M13.5 9.5 15 8a2.5 2.5 0 1 0-3.5-3.5L11 5l-.5-.5A2.5 2.5 0 1 0 7 8l3.5 3.5" />
          </Feature>
          <Feature title="Consumo consciente" desc="Móveis, roupas e utensílios ganham nova vida em vez de virarem descarte.">
            <path d="M7 19H4.8a1.8 1.8 0 0 1-1.5-2.7L5 13" /><path d="m9 9-2.4 4.2 4.4.3" />
            <path d="M14 5.5 12.7 3.2a1.8 1.8 0 0 0-3 0L8 6" /><path d="m14 5.5 2.6 4.5 3.4-2.6" />
            <path d="M18 13.5 20.2 17a1.8 1.8 0 0 1-1.5 2.7H15" /><path d="m18 19-4.8.2 1.2-4.2" />
          </Feature>
          <Feature title="Transparência simples" desc="Preços visíveis, situação do item atualizada e reserva registrada por WhatsApp.">
            <path d="M12 3 5 6v5c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V6z" /><path d="m9 12 2 2 4-4" />
          </Feature>
        </section>

        <Section title="Em destaque" sub="Selecionados pela equipe de voluntários" more="/produtos">
          <Grid>{destaques.map((p) => <ProductCard key={p.id} p={p} />)}</Grid>
        </Section>

        <Section title="Categorias" sub="Encontre pelo que você procura">
          <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
            {categorias.map((c) => (
              <Link key={c.slug} href={`/produtos?cat=${c.slug}`}
                className="flex items-center gap-3 rounded-2xl border border-transparent bg-surface p-5 transition-all hover:border-line hover:bg-white hover:shadow-soft">
                <span className="text-2xl">{c.icone}</span>
                <b className="text-[15px]">{c.nome}</b>
              </Link>
            ))}
          </div>
        </Section>

        <Section title="Como funciona" sub="Três passos, nenhum cadastro">
          <div className="grid gap-4 md:grid-cols-3">
            <Step n="01" t="Escolha um item" d="Navegue pelo catálogo e abra o produto que gostou para ver detalhes e fotos." />
            <Step n="02" t="Reserve pelo WhatsApp" d="Um toque monta uma mensagem já preenchida com o código, o nome e o valor." />
            <Step n="03" t="Combine a retirada" d="Um voluntário confirma a reserva e combina o melhor horário para você retirar no local." />
          </div>
        </Section>

        <Section title="Recém-chegados" sub="Novidades desta semana" more="/produtos">
          <Grid>{novos.map((p) => <ProductCard key={p.id} p={p} />)}</Grid>
        </Section>

        <section className="py-11">
          <div className="flex flex-wrap items-center justify-between gap-7 rounded-[22px] bg-gradient-to-br from-[#123f66] to-green px-10 py-11 text-white">
            <div>
              <h2 className="max-w-[20ch] font-display text-[clamp(24px,3.4vw,34px)] font-semibold">
                Seu item que descansa no armário pode ajudar uma família.
              </h2>
              <p className="mt-3 max-w-[46ch] opacity-90">
                Aceitamos móveis, roupas, livros, utensílios e brinquedos em bom estado. Você mesmo entrega no nosso endereço.
              </p>
            </div>
            <Button href="/como-doar" size="lg" variant="outline" className="!border-white !bg-white !text-[#123f66]">
              Como doar →
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function Feature({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-[#d3e3f2] hover:shadow-soft">
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-green-soft text-green">
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          {children}
        </svg>
      </div>
      <h4 className="mb-2 font-display text-[18.5px] font-semibold">{title}</h4>
      <p className="text-[14.5px] text-muted">{desc}</p>
    </div>
  );
}
function Section({ title, sub, more, children }: { title: string; sub?: string; more?: string; children: React.ReactNode }) {
  return (
    <section className="py-11">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-[clamp(24px,3.2vw,32px)] font-semibold">{title}</h2>
          {sub && <p className="mt-1.5 text-[15px] text-muted">{sub}</p>}
        </div>
        {more && <Link href={more} className="whitespace-nowrap text-[14.5px] font-semibold text-green-600">Ver todos →</Link>}
      </div>
      {children}
    </section>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-5 md:grid-cols-4">{children}</div>;
}
function Step({ n, t, d }: { n: string; t: string; d: string }) {
  return (
    <div className="rounded-xl2 bg-surface p-6">
      <div className="mb-3 font-mono text-sm font-bold text-green">{n}</div>
      <h4 className="mb-1.5 font-display text-lg font-semibold">{t}</h4>
      <p className="text-[14.5px] text-muted">{d}</p>
    </div>
  );
}
