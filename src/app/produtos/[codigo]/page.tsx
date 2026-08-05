import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getProdutoPorCodigo, getSemelhantes, getConfig } from "@/lib/queries";
import { linkReservaWhatsApp } from "@/lib/whatsapp";
import { brl } from "@/lib/utils";
import { config } from "@/lib/config";
import { Button, StatusBadge, Tag } from "@/components/ui";
import { BotaoReservar } from "@/components/catalog/BotaoReservar";
import { ProductCard } from "@/components/catalog/ProductCard";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { codigo: string } }): Promise<Metadata> {
  const p = await getProdutoPorCodigo(params.codigo);
  if (!p) return { title: "Produto não encontrado" };
  return {
    title: `${p.nome} — ${p.codigo}`,
    description: p.descricao ?? `${p.nome} · ${brl(p.preco)}`,
    openGraph: {
      title: p.nome,
      description: p.descricao ?? "",
      images: p.imagem_principal ? [p.imagem_principal] : [],
    },
    alternates: { canonical: `/produtos/${p.codigo}` },
  };
}

export default async function ProdutoPage({ params }: { params: { codigo: string } }) {
  const p = await getProdutoPorCodigo(params.codigo);
  if (!p) notFound();

  const [semelhantes, cfg] = await Promise.all([
    getSemelhantes(p.codigo, p.categoria_slug),
    getConfig(),
  ]);
  const reservaClienteVencida =
    p.status === "reservado" && p.reserva_origem === "cliente" &&
    !!p.reserva_expira_em && new Date(p.reserva_expira_em).getTime() < Date.now();
  const disponivel = p.status === "disponivel" || reservaClienteVencida;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.nome,
    sku: p.codigo,
    description: p.descricao ?? undefined,
    category: p.categoria_nome ?? undefined,
    image: p.imagem_principal ? [p.imagem_principal] : undefined,
    offers: {
      "@type": "Offer",
      price: p.preco,
      priceCurrency: "BRL",
      availability: disponivel ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${config.siteUrl}/produtos/${p.codigo}`,
    },
  };

  return (
    <div className="mx-auto max-w-[1120px] px-[22px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="py-6">
        <nav className="mb-5 text-[13.5px] text-muted">
          <Link href="/produtos" className="font-semibold text-green-600">Produtos</Link>
          {" › "}{p.categoria_nome}{" › "}{p.nome}
        </nav>

        <div className="grid gap-11 md:grid-cols-[1.05fr_.95fr]">
          {/* GALERIA */}
          <div>
            <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-[18px] border border-line bg-surface text-8xl">
              {p.imagem_principal ? (
                <Image src={p.imagem_principal} alt={p.nome} width={720} height={540} className="h-full w-full object-contain" />
              ) : (p.categoria_icone ?? "🎁")}
            </div>
          </div>

          {/* PAINEL */}
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <StatusBadge status={p.status} />
              <Tag>{p.codigo}</Tag>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">{p.categoria_nome}</span>
            </div>
            <h1 className="my-3 font-display text-[clamp(26px,3.6vw,36px)] font-semibold leading-tight">{p.nome}</h1>
            <div className="mb-4 font-display text-[34px] font-bold">{brl(p.preco)}</div>
            {p.descricao && <p className="text-[15.5px] text-muted">{p.descricao}</p>}

            <div className="my-5 overflow-hidden rounded-2xl border border-line">
              <Spec k="Estado de conservação" v={p.estado} />
              <Spec k="Categoria" v={p.categoria_nome} />
              <Spec k="Dimensões" v={p.dimensoes} />
              <Spec k="Código" v={p.codigo} mono />
              {p.observacoes && <Spec k="Observações" v={p.observacoes} />}
            </div>

            <div className="rounded-2xl border border-line bg-surface p-5">
              {disponivel ? (
                <>
                  <BotaoReservar codigo={p.codigo} waLink={linkReservaWhatsApp(p, cfg)} />
                  <p className="mt-3 flex items-start gap-2 text-[13px] text-muted">
                    <span>✳️</span>
                    <span>A mensagem já vai preenchida com o código <b>{p.codigo}</b>, nome, valor e data — assim o voluntário identifica o item na hora.</span>
                  </p>
                </>
              ) : (
                <Button size="lg" className="w-full" disabled>
                  {p.status === "reservado" ? "🟡 Já reservado" : "🔴 Já vendido"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {semelhantes.length > 0 && (
        <section className="py-11">
          <h2 className="mb-6 font-display text-[clamp(22px,3vw,28px)] font-semibold">Produtos semelhantes</h2>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {semelhantes.map((s) => <ProductCard key={s.id} p={s} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function Spec({ k, v, mono }: { k: string; v?: string | null; mono?: boolean }) {
  return (
    <div className="flex justify-between border-b border-line px-4 py-2.5 text-[14.5px] last:border-b-0">
      <span className="text-muted">{k}</span>
      <b className={mono ? "font-mono font-semibold" : "font-semibold"}>{v ?? "—"}</b>
    </div>
  );
}
