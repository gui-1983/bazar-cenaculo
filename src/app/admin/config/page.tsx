"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui";

type Form = {
  nome_site: string; instituicao: string; descricao: string;
  whatsapp: string; email: string; instagram: string;
  endereco: string; horarios: string; hero_url: string;
};
const vazio: Form = {
  nome_site: "", instituicao: "", descricao: "", whatsapp: "", email: "",
  instagram: "", endereco: "", horarios: "", hero_url: "",
};

async function paraWebp(file: File, maxW = 1600): Promise<Blob> {
  const img = await createImageBitmap(file);
  const escala = Math.min(1, maxW / img.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * escala);
  canvas.height = Math.round(img.height * escala);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((res) => canvas.toBlob((b) => res(b!), "image/webp", 0.85));
}

export default function Configuracoes() {
  const router = useRouter();
  const sb = supabaseBrowser();
  const [f, setF] = useState<Form>(vazio);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const set = (k: keyof Form, v: string) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    sb.from("configuracoes").select("*").eq("id", 1).maybeSingle().then(({ data }) => {
      if (data) {
        setF({
          nome_site: data.nome_site ?? "", instituicao: data.instituicao ?? "",
          descricao: data.descricao ?? "", whatsapp: data.whatsapp ?? "",
          email: data.email ?? "", instagram: data.instagram ?? "",
          endereco: data.endereco ?? "", horarios: data.horarios ?? "",
          hero_url: data.hero_url ?? "",
        });
      }
      setCarregando(false);
    });
  }, [sb]);

  async function enviarFoto(file: File) {
    setEnviando(true); setMsg(null);
    try {
      const blob = await paraWebp(file);
      const path = `site/hero-${Date.now()}.webp`;
      const up = await sb.storage.from("produtos").upload(path, blob, { contentType: "image/webp", upsert: true });
      if (up.error) throw up.error;
      const { data: pub } = sb.storage.from("produtos").getPublicUrl(path);
      set("hero_url", pub.publicUrl);
      setMsg("Foto do topo enviada. Não esqueça de salvar.");
    } catch {
      setMsg("Não consegui enviar a foto. Tente outra imagem.");
    }
    setEnviando(false);
  }

  async function salvar() {
    setSalvando(true); setMsg(null);
    const { error } = await sb.from("configuracoes").update({
      nome_site: f.nome_site || null, instituicao: f.instituicao || null,
      descricao: f.descricao || null, whatsapp: f.whatsapp.replace(/\D/g, "") || null,
      email: f.email || null, instagram: f.instagram || null,
      endereco: f.endereco || null, horarios: f.horarios || null,
      hero_url: f.hero_url || null,
    }).eq("id", 1);
    setSalvando(false);
    setMsg(error ? "Erro ao salvar: " + error.message : "Configurações salvas com sucesso!");
  }

  async function sair() {
    await sb.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="grid gap-6 md:grid-cols-[230px_1fr]">
      <AdminSidebar active="config" />
      <div className="max-w-[620px]">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-semibold">Configurações</h1>
          <button onClick={sair} className="text-sm font-semibold text-muted hover:text-vend">Sair</button>
        </div>
        <p className="mb-5 mt-1 text-sm text-muted">
          Só administradores veem esta tela. As mudanças aparecem no site em alguns instantes.
        </p>

        {carregando ? (
          <div className="rounded-2xl border border-line bg-white p-8 text-center text-sm text-muted">Carregando…</div>
        ) : (
          <div className="space-y-5">
            <Card titulo="Contato" nota="É este WhatsApp que recebe as reservas e este e-mail que aparece no rodapé.">
              <Campo label="WhatsApp (com DDD)" valor={f.whatsapp} on={(v) => set("whatsapp", v)} placeholder="31 99999-9999" inputMode="tel" />
              <Campo label="E-mail" valor={f.email} on={(v) => set("email", v)} placeholder="bazar@cenaculo.org.br" inputMode="email" />
              <Campo label="Instagram (link)" valor={f.instagram} on={(v) => set("instagram", v)} placeholder="https://instagram.com/..." />
            </Card>

            <Card titulo="Identidade da casa">
              <Campo label="Nome do site" valor={f.nome_site} on={(v) => set("nome_site", v)} placeholder="Bazar Beneficente" />
              <Campo label="Nome da instituição" valor={f.instituicao} on={(v) => set("instituicao", v)} placeholder="Cenáculo Espírita Thiago Maior" />
              <Campo label="Frase de apresentação" valor={f.descricao} on={(v) => set("descricao", v)} textarea placeholder="Toda a arrecadação sustenta nossas ações sociais." />
            </Card>

            <Card titulo="Endereço e horários">
              <Campo label="Endereço" valor={f.endereco} on={(v) => set("endereco", v)} placeholder="Rua Exemplo, 123 — Belo Horizonte/MG" />
              <Campo label="Horários de funcionamento" valor={f.horarios} on={(v) => set("horarios", v)} placeholder="Terça a sábado · 9h às 17h" />
            </Card>

            <Card titulo="Foto do topo" nota="Aparece no início do site. Use uma foto boa do bazar (paisagem, bem iluminada).">
              {f.hero_url && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={f.hero_url} alt="Prévia do topo" className="mb-3 aspect-[4/3] w-full rounded-xl object-cover" />
              )}
              <label className="block cursor-pointer rounded-xl border-2 border-dashed border-[#cfe0d7] bg-surface p-6 text-center text-sm text-muted">
                {enviando ? "Enviando…" : "📷 Escolher foto do topo"}
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && enviarFoto(e.target.files[0])} />
              </label>
              {f.hero_url && (
                <button onClick={() => set("hero_url", "")} className="mt-2 text-xs font-semibold text-muted hover:text-vend">
                  Remover foto (voltar à ilustração)
                </button>
              )}
            </Card>

            {msg && <p className={`text-sm ${msg.includes("sucesso") || msg.includes("enviada") ? "text-green-600" : "text-vend"}`}>{msg}</p>}

            <div className="sticky bottom-3 z-10 flex flex-col gap-2 rounded-2xl border border-line bg-white/90 p-3 backdrop-blur sm:flex-row">
              <Button onClick={salvar} disabled={salvando} className="w-full">
                {salvando ? "Salvando…" : "Salvar configurações"}
              </Button>
              <Button href="/admin/produtos/novo" variant="outline" className="w-full">Cadastrar produto</Button>
            </div>
            <p className="pb-4 text-center text-xs text-muted">
              <Link href="/" className="font-semibold text-green-600">Ver o site →</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ titulo, nota, children }: { titulo: string; nota?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <h2 className="font-display text-[17px] font-semibold">{titulo}</h2>
      {nota && <p className="mb-4 mt-1 text-[13px] text-muted">{nota}</p>}
      <div className={nota ? "space-y-4" : "mt-4 space-y-4"}>{children}</div>
    </div>
  );
}

function Campo({
  label, valor, on, placeholder, textarea, inputMode,
}: {
  label: string; valor: string; on: (v: string) => void;
  placeholder?: string; textarea?: boolean; inputMode?: "tel" | "email" | "text";
}) {
  const cls = "w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-[15px] outline-none focus:border-green";
  return (
    <div>
      <label className="mb-1.5 block text-[13.5px] font-semibold">{label}</label>
      {textarea ? (
        <textarea className={cls} rows={2} value={valor} placeholder={placeholder} onChange={(e) => on(e.target.value)} />
      ) : (
        <input className={cls} value={valor} placeholder={placeholder} inputMode={inputMode} onChange={(e) => on(e.target.value)} />
      )}
    </div>
  );
}
