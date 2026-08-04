import type { Metadata } from "next";
import { Button, Eyebrow } from "@/components/ui";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  title: "Nossa História",
  description: `Conheça o ${config.instituicao} e como o bazar ajuda os projetos sociais.`,
};

export default function Institucional() {
  return (
    <div className="mx-auto max-w-[1120px] px-[22px]">
      <section className="py-16 pb-2">
        <Eyebrow>Nossa história</Eyebrow>
        <h1 className="mt-5 max-w-[18ch] font-display text-[clamp(30px,5vw,52px)] font-bold leading-[1.05] tracking-tight">
          Um bazar que é, na verdade, uma corrente.
        </h1>
        <p className="my-5 max-w-[54ch] text-[clamp(16px,2.1vw,19px)] text-muted">
          O {config.instituicao} mantém projetos sociais que dependem do envolvimento da comunidade.
          O bazar é um dos elos: transforma doações em recursos, e recursos em ações concretas.
        </p>
      </section>
      <section className="grid gap-4 py-11 md:grid-cols-3">
        <Card t="Quem somos" d="Uma casa espírita voltada ao estudo, à prática da caridade e ao acolhimento de quem precisa." />
        <Card t="Nossa missão" d="Servir. Cada doação recebida e cada reserva feita se converte em apoio direto às famílias atendidas." />
        <Card t="Como o bazar ajuda" d="100% do valor arrecadado sustenta os projetos: cestas, atendimento fraterno e ações educativas." />
      </section>
      <section className="py-11">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-[22px] bg-gradient-to-br from-[#0f5138] to-green px-10 py-11 text-white">
          <div>
            <h2 className="font-display text-[clamp(24px,3.4vw,32px)] font-semibold">Quer conhecer os projetos de perto?</h2>
            <p className="mt-2 opacity-90">Visite a casa ou fale com a gente. Você é sempre bem-vindo.</p>
          </div>
          <Button href="/contato" size="lg" variant="outline" className="!bg-white !text-[#0f5138] !border-white">Fale conosco →</Button>
        </div>
      </section>
    </div>
  );
}
function Card({ t, d }: { t: string; d: string }) {
  return (
    <div className="rounded-xl2 bg-surface p-6">
      <div className="mb-3 text-green">✦</div>
      <h3 className="mb-1.5 font-display text-lg font-semibold">{t}</h3>
      <p className="text-[14.5px] text-muted">{d}</p>
    </div>
  );
}
