"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button, Tag } from "@/components/ui";
import { brl } from "@/lib/utils";
import type { Categoria } from "@/lib/types";

const ESTADOS = ["Novo", "Seminovo", "Usado — bom", "Usado — com marcas"];
const STATUS = [
  { v: "disponivel", label: "🟢 Disponível" },
  { v: "reservado", label: "🟡 Reservado" },
  { v: "vendido", label: "🔴 Vendido" },
  { v: "oculto", label: "👁️ Oculto" },
];

type ImgExistente = { id: string; url: string };

async function paraWebp(file: File, maxW = 1600): Promise<Blob> {
  const img = await createImageBitmap(file);
  const escala = Math.min(1, maxW / img.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * escala);
  canvas.height = Math.round(img.height * escala);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((res) => canvas.toBlob((b) => res(b!), "image/webp", 0.82));
}

// extrai o caminho no bucket a partir da URL pública
function caminhoDaUrl(url: string): string | null {
  const m = url.split("/storage/v1/object/public/produtos/")[1];
  return m ? decodeURIComponent(m) : null;
}

export default function ProdutoForm() {
  const router = useRouter();
  const sb = supabaseBrowser();
  const [cats, setCats] = useState<Categoria[]>([]);
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [codigo, setCodigo] = useState<string>("");
  const [imgs, setImgs] = useState<ImgExistente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [f, setF] = useState({
    nome: "", categoria_id: "", estado: "Usado — bom", preco: "",
    quantidade: "1", descricao: "", dimensoes: "", observacoes: "",
    destaque: false, status: "disponivel", valor_final: "",
  });
  const set = (k: string, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("editar");
    async function carregar() {
      const { data: categorias } = await sb.from("categorias").select("*").order("ordem");
      setCats(categorias ?? []);
      if (id) {
        setEditId(id);
        const { data: p } = await sb.from("produtos").select("*").eq("id", id).maybeSingle();
        if (p) {
          setCodigo(p.codigo);
          setF({
            nome: p.nome ?? "", categoria_id: p.categoria_id ?? "", estado: p.estado ?? "Usado — bom",
            preco: p.preco != null ? String(p.preco) : "", quantidade: String(p.quantidade ?? 1),
            descricao: p.descricao ?? "", dimensoes: p.dimensoes ?? "", observacoes: p.observacoes ?? "",
            destaque: !!p.destaque, status: p.status ?? "disponivel",
            valor_final: p.valor_final != null ? String(p.valor_final) : "",
          });
        }
        const { data: imagens } = await sb.from("produto_imagens").select("id, url").eq("produto_id", id).order("ordem");
        setImgs((imagens as ImgExistente[]) ?? []);
      }
      setCarregando(false);
    }
    carregar();
  }, [sb]);

  async function subirImagens(produtoId: string, offset: number) {
    const lista = arquivos.slice(0, Math.max(0, 10 - offset));
    for (let i = 0; i < lista.length; i++) {
      const blob = await paraWebp(lista[i]);
      const path = `${produtoId}/${Date.now()}-${offset + i}.webp`;
      const up = await sb.storage.from("produtos").upload(path, blob, { contentType: "image/webp" });
      if (!up.error) {
        const { data: pub } = sb.storage.from("produtos").getPublicUrl(path);
        await sb.from("produto_imagens").insert({
          produto_id: produtoId, url: pub.publicUrl, ordem: offset + i, principal: offset + i === 0,
        });
      }
    }
  }

  async function removerImagem(img: ImgExistente) {
    await sb.from("produto_imagens").delete().eq("id", img.id);
    const path = caminhoDaUrl(img.url);
    if (path) await sb.storage.from("produtos").remove([path]);
    setImgs((prev) => prev.filter((x) => x.id !== img.id));
  }

  async function salvar() {
    if (!f.nome.trim()) { setMsg("Dê um nome ao produto."); return; }
    setSalvando(true); setMsg(null);

    const payload = {
      nome: f.nome,
      categoria_id: f.categoria_id || null,
      estado: f.estado,
      preco: Number(f.preco || 0),
      quantidade: Number(f.quantidade || 1),
      descricao: f.descricao || null,
      dimensoes: f.dimensoes || null,
      observacoes: f.observacoes || null,
      destaque: f.destaque,
      status: f.status,
      // valor final só vale quando vendido; sem valor, o banco assume o preço
      valor_final: f.status === "vendido" ? Number(f.valor_final || f.preco || 0) : null,
    };

    if (editId) {
      const { error } = await sb.from("produtos").update(payload).eq("id", editId);
      if (error) { setSalvando(false); setMsg("Erro ao salvar: " + error.message); return; }
      if (arquivos.length) await subirImagens(editId, imgs.length);
      setSalvando(false);
      setMsg("Alterações salvas!");
      setTimeout(() => { router.push("/admin/produtos"); router.refresh(); }, 800);
    } else {
      const { data: prod, error } = await sb.from("produtos").insert(payload).select("id, codigo").single();
      if (error || !prod) { setSalvando(false); setMsg("Erro ao salvar: " + (error?.message ?? "")); return; }
      if (arquivos.length) await subirImagens(prod.id, 0);
      setSalvando(false);
      setMsg(`Produto ${prod.codigo} salvo!`);
      setTimeout(() => { router.push("/admin/produtos"); router.refresh(); }, 800);
    }
  }

  async function excluir() {
    if (!editId) return;
    if (!confirm("Excluir este produto definitivamente? Esta ação não pode ser desfeita.")) return;
    setExcluindo(true);
    for (const img of imgs) { const p = caminhoDaUrl(img.url); if (p) await sb.storage.from("produtos").remove([p]); }
    await sb.from("produto_imagens").delete().eq("produto_id", editId);
    const { error } = await sb.from("produtos").delete().eq("id", editId);
    setExcluindo(false);
    if (error) { setMsg("Erro ao excluir: " + error.message); return; }
    router.push("/admin/produtos"); router.refresh();
  }

  if (carregando) {
    return (
      <div className="grid gap-6 md:grid-cols-[230px_1fr]">
        <AdminSidebar active="produtos" />
        <div className="rounded-2xl border border-line bg-white p-10 text-center text-sm text-muted">Carregando…</div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[230px_1fr]">
      <AdminSidebar active={editId ? "produtos" : "novo"} />
      <div className="max-w-[620px]">
        <h1 className="font-display text-2xl font-semibold">{editId ? "Editar produto" : "Cadastrar produto"}</h1>
        <p className="mb-5 mt-1 text-sm text-muted">
          {editId
            ? <>Código <Tag>{codigo}</Tag> — as alterações aparecem no site em instantes.</>
            : <>O código <Tag>BAZ-000000</Tag> é gerado automaticamente ao salvar.</>}
        </p>

        <div className="space-y-4 rounded-2xl border border-line bg-white p-5">
          <Field label="Nome do produto">
            <input className={inp} value={f.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Ex.: Cadeira de madeira maciça" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoria">
              <select className={inp} value={f.categoria_id} onChange={(e) => set("categoria_id", e.target.value)}>
                <option value="">Selecione…</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.icone} {c.nome}</option>)}
              </select>
            </Field>
            <Field label="Estado de conservação">
              <select className={inp} value={f.estado} onChange={(e) => set("estado", e.target.value)}>
                {ESTADOS.map((e) => <option key={e}>{e}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Preço anunciado (R$)">
              <input className={inp} type="number" value={f.preco} onChange={(e) => set("preco", e.target.value)} placeholder="0,00" />
            </Field>
            <Field label="Quantidade">
              <input className={inp} type="number" value={f.quantidade} onChange={(e) => set("quantidade", e.target.value)} />
            </Field>
          </div>
          <Field label="Descrição">
            <textarea className={inp} rows={3} value={f.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="Detalhes, medidas, observações…" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Dimensões (opcional)">
              <input className={inp} value={f.dimensoes} onChange={(e) => set("dimensoes", e.target.value)} placeholder="Ex.: 45 × 42 × 90 cm" />
            </Field>
            <Field label="Situação">
              <select className={inp} value={f.status} onChange={(e) => set("status", e.target.value)}>
                {STATUS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
              </select>
            </Field>
          </div>

          {/* Valor final da venda — aparece só quando "Vendido" */}
          {f.status === "vendido" && (
            <div className="rounded-xl border border-[#cfe0d7] bg-green-soft p-4">
              <Field label="Valor final da venda (R$)">
                <input className={inp} type="number" value={f.valor_final}
                  onChange={(e) => set("valor_final", e.target.value)}
                  placeholder={f.preco ? `Sugestão: ${f.preco}` : "0,00"} />
              </Field>
              <p className="mt-2 text-xs text-muted">
                É este valor que entra no relatório de arrecadação. Se deixar em branco, usamos o preço anunciado
                {f.preco && <> ({brl(Number(f.preco))})</>}.
              </p>
            </div>
          )}

          {/* Fotos já cadastradas (na edição) */}
          {editId && imgs.length > 0 && (
            <Field label="Fotos atuais">
              <div className="flex flex-wrap gap-2">
                {imgs.map((img) => (
                  <div key={img.id} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" className="h-20 w-20 rounded-lg object-cover" />
                    <button type="button" onClick={() => removerImagem(img)}
                      className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-vend text-xs text-white shadow">✕</button>
                  </div>
                ))}
              </div>
            </Field>
          )}

          <Field label={editId ? "Adicionar mais fotos" : "Fotos (até 10 — convertidas para WebP automaticamente)"}>
            <label className="block cursor-pointer rounded-xl border-2 border-dashed border-[#cfe0d7] bg-surface p-6 text-center text-sm text-muted">
              📷 Toque para escolher as fotos
              <input type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => setArquivos(Array.from(e.target.files ?? []))} />
            </label>
            {arquivos.length > 0 && <p className="mt-2 text-xs text-muted">{arquivos.length} nova(s) foto(s) selecionada(s)</p>}
          </Field>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={f.destaque} onChange={(e) => set("destaque", e.target.checked)} />
            Marcar como produto em destaque
          </label>

          {msg && <p className={`text-sm ${msg.includes("salv") ? "text-green-600" : "text-vend"}`}>{msg}</p>}
          <Button onClick={salvar} disabled={salvando} className="w-full">
            {salvando ? "Salvando…" : editId ? "Salvar alterações" : "Salvar produto"}
          </Button>

          {editId && (
            <button onClick={excluir} disabled={excluindo}
              className="mt-1 w-full rounded-xl border border-[#f0d3d2] py-2.5 text-sm font-semibold text-vend hover:bg-vend-bg">
              {excluindo ? "Excluindo…" : "Excluir produto"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const inp = "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-[14.5px] outline-none focus:border-green";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[13.5px] font-semibold">{label}</label>
      {children}
    </div>
  );
}
