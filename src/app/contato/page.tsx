import type { Metadata } from "next";
import { Eyebrow, Button } from "@/components/ui";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com o Bazar Beneficente por WhatsApp, e-mail ou redes sociais.",
};

export default function Contato() {
  return (
    <div className="mx-auto max-w-[1120px] px-[22px]">
      <section className="py-16 pb-2">
        <Eyebrow>Contato</Eyebrow>
        <h1 className="mt-5 font-display text-[clamp(30px,5vw,52px)] font-bold leading-[1.05] tracking-tight">
          Fale com a gente.
        </h1>
        <p className="my-5 max-w-[52ch] text-[clamp(16px,2.1vw,19px)] text-muted">
          O jeito mais rápido é pelo WhatsApp. Também estamos no e-mail e nas redes sociais.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button href={`https://wa.me/${config.whatsapp}`} external variant="whatsapp" size="lg">WhatsApp</Button>
          <Button href={`mailto:${config.email}`} size="lg" variant="outline">Enviar e-mail</Button>
          {config.instagram && <Button href={config.instagram} external size="lg" variant="outline">Instagram</Button>}
        </div>
      </section>
      <section className="py-8 pb-16">
        <div className="max-w-[520px] overflow-hidden rounded-2xl border border-line">
          <Row k="WhatsApp" v={config.whatsapp} />
          <Row k="E-mail" v={config.email} />
          <Row k="Endereço" v={config.endereco} />
          <Row k="Atendimento" v={config.horario} />
        </div>
      </section>
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-line px-4 py-3 text-[14.5px] last:border-b-0">
      <span className="text-muted">{k}</span><b className="font-semibold">{v}</b>
    </div>
  );
}
