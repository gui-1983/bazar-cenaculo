"use client";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { brl } from "@/lib/utils";
import { Button, StatusBadge } from "@/components/ui";
import type { Produto } from "@/lib/types";

const inicioDeHoje = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const valorDe = (p: Produto) => (p.valor_final ?? p.preco) || 0;
const hora = (iso: string | null) => iso ? new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";
const MOSTRAR = 15; // teto de linhas renderizadas na lista de hoje
const FORMAS = [
  { v: "dinheiro", label: "Dinheiro" },
  { v: "pix", label: "Pix" },
  { v: "credito", label: "Crédito" },
  { v: "debito", label: "Débito" },
];
const formaLabel = (v: string | null) => FORMAS.find((f) => f.v === v)?.label ?? "—";

export default function Vendas() {
  const sb = supabaseBrowser();
  const [itens, setItens] = useState<Produto[]>([]);
  const [vendasHoje, setVendasHoje] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [selId, setSelId] = useState("");
  const [valor, setValor] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [confirmando, setConfirmando] = useState(false);
  const [verHoje, setVerHoje] = useState(false);
  const [buscaHoje, setBuscaHoje] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const [ultima, setUltima] = useState<Produto | null>(null); // p/ desfazer rápido
  const [pagamento, setPagamento] = useState("dinheiro");

  useEffect(() => {
    async function carregar() {
      const { data } = await sb.from("vw_produtos").select("*")
        .in("status", ["disponivel", "reservado"]).order("nome");
      setItens((data as Produto[]) ?? []);
      const { data: vh } = await sb.from("vw_produtos").select("*")
        .eq("status", "vendido").gte("vendido_em", inicioDeHoje().toISOString())
        .order("vendido_em", { ascending: false });
      setVendasHoje((vh as Produto[]) ?? []);
      setCarregando(false);
    }
    carregar();
  }, [sb]);

  const total = useMemo(() => vendasHoje.reduce((s, p) => s + valorDe(p), 0), [vendasHoje]);
  const qtd = vendasHoje.length;

  const opcoes = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return q ? itens.filter((p) => p.nome.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)) : itens;
  }, [itens, busca]);
  const sel = useMemo(() => itens.find((p) => p.id === selId) ?? null, [itens, selId]);

  // lista de hoje filtrada e limitada (nunca renderiza tudo de uma vez)
  const hojeFiltradas = useMemo(() => {
    const q = buscaHoje.trim().toLowerCase();
    return q ? vendasHoje.filter((p) => p.nome.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)) : vendasHoje;
  }, [vendasHoje, buscaHoje]);
  const hojeMostradas = hojeFiltradas.slice(0, MOSTRAR);

  function escolher(id: string) {
    setSelId(id);
    const p = itens.find((x) => x.id === id);
    setValor(p ? String(p.preco ?? "") : "");
    setPagamento("dinheiro");
  }

  async function confirmar() {
    if (!sel) return;
    setConfirmando(true);
    const final = Number(valor || sel.preco || 0);
    const agora = new Date().toISOString();
    const { error } = await sb.from("produtos")
      .update({ status: "vendido", valor_final: final, vendido_em: agora, forma_pagamento: pagamento }).eq("id", sel.id);
    setConfirmando(false);
    if (error) { setFlash("Erro ao registrar: " + error.message); return; }
    const vendido: Produto = { ...sel, status: "vendido", valor_final: final, vendido_em: agora, forma_pagamento: pagamento };
    setItens((prev) => prev.filter((x) => x.id !== sel.id));
    setVendasHoje((prev) => [vendido, ...prev]);
    setFlash(`Venda registrada: ${sel.nome} · ${brl(final)}`);
    setUltima(vendido);
    setSelId(""); setValor("");
    setTimeout(() => { setFlash(null); setUltima(null); }, 8000);
  }

  async function desfazer(p: Produto) {
    const { error } = await sb.from("produtos")
      .update({ status: "disponivel", valor_final: null, vendido_em: null }).eq("id", p.id);
    if (error) { setFlash("Erro ao desfazer: " + error.message); return; }
    setVendasHoje((prev) => prev.filter((x) => x.id !== p.id));
    setItens((prev) => [...prev, { ...p, status: "disponivel", valor_final: null, vendido_em: null } as Produto]
      .sort((a, b) => a.nome.localeCompare(b.nome)));
    if (ultima?.id === p.id) setUltima(null);
    setFlash(`Venda desfeita: ${p.nome} voltou para a lista.`);
    setTimeout(() => setFlash(null), 3500);
  }

  function pedirDesfazer(p: Produto) {
    if (confirm(`Desfazer a venda de "${p.nome}"? O produto volta para a lista.`)) desfazer(p);
  }

  return (
    <div className="grid gap-6 md:grid-cols-[230px_1fr]">
      <AdminSidebar active="vendas" />
      <div className="max-w-[560px]">
        {/* Total do dia */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-br from-[#123f66] to-green px-6 py-5 text-white">
          <div>
            <div className="text-[13px] font-semibold opacity-90">Vendas de hoje</div>
            <div className="font-display text-[32px] font-bold leading-tight">{brl(total)}</div>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl font-bold">{qtd}</div>
            <div className="text-[13px] opacity-90">{qtd === 1 ? "item vendido" : "itens vendidos"}</div>
          </div>
        </div>

        {/* Aviso com desfazer rápido da última venda */}
        {flash && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-green/30 bg-green-soft px-4 py-2.5 text-sm font-medium text-green-600">
            <span>✓ {flash}</span>
            {ultima && (
              <button onClick={() => desfazer(ultima)} className="flex-none font-semibold text-vend underline underline-offset-2">Desfazer</button>
            )}
          </div>
        )}

        <h1 className="mt-4 font-display text-2xl font-semibold">Registrar venda</h1>
        <p className="mb-4 mt-0.5 text-sm text-muted">
          Escolha o produto na lista. Só os detalhes do item selecionado aparecem — leve mesmo com muitos produtos.
        </p>

        {carregando ? (
          <div className="rounded-2xl border border-line bg-white p-10 text-center text-sm text-muted">Carregando…</div>
        ) : (
          <>
            <div className="rounded-2xl border border-line bg-white p-5">
              <label className="mb-1.5 block text-[13.5px] font-semibold">Buscar (opcional)</label>
              <input value={busca} onChange={(e) => setBusca(e.target.value)}
                placeholder="Filtrar por nome ou código…"
                className="mb-4 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[14.5px] outline-none focus:border-green" />

              <label className="mb-1.5 block text-[13.5px] font-semibold">Produto</label>
              <select value={selId} onChange={(e) => escolher(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-[15px] outline-none focus:border-green">
                <option value="">— selecione um produto ({opcoes.length}) —</option>
                {opcoes.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome} — {brl(p.preco)} ({p.codigo})</option>
                ))}
              </select>

              {sel ? (
                <div className="mt-5 border-t border-line pt-5">
                  <div className="flex gap-3">
                    <span className="grid h-16 w-16 flex-none place-items-center overflow-hidden rounded-xl bg-surface text-2xl">
                      {sel.imagem_principal
                        /* eslint-disable-next-line @next/next/no-img-element */
                        ? <img src={sel.imagem_principal} alt="" className="h-full w-full object-cover" />
                        : "📦"}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <b className="font-display text-lg font-semibold">{sel.nome}</b>
                        {sel.status === "reservado" && <StatusBadge status="reservado" />}
                      </div>
                      <div className="mt-0.5 text-[13px] text-muted">
                        <span className="font-mono">{sel.codigo}</span>
                        {sel.estado && <> · {sel.estado}</>}
                        {sel.dimensoes && <> · {sel.dimensoes}</>}
                      </div>
                    </div>
                  </div>
                  <p className="my-4 text-[14.5px] text-ink">{sel.descricao || "Sem descrição cadastrada."}</p>
                  <label className="mb-1.5 block text-[13.5px] font-semibold">Valor final da venda (R$)</label>
                  <input autoFocus type="number" value={valor} onChange={(e) => setValor(e.target.value)}
                    className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-lg font-semibold outline-none focus:border-green" />
                  <p className="mb-3 mt-2 text-xs text-muted">Já vem o preço anunciado ({brl(sel.preco)}). Ajuste se houve pechincha — é este valor que entra no relatório.</p>
                  <label className="mb-1.5 block text-[13.5px] font-semibold">Forma de pagamento</label>
                  <div className="mb-4 grid grid-cols-4 gap-2">
                    {FORMAS.map((fp) => (
                      <button key={fp.v} type="button" onClick={() => setPagamento(fp.v)}
                        className={`rounded-xl border px-2 py-2.5 text-[13px] font-semibold transition-colors ${pagamento === fp.v ? "border-green bg-green text-white" : "border-line bg-surface text-muted hover:bg-white"}`}>
                        {fp.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2.5">
                    <Button onClick={() => { setSelId(""); setValor(""); }} variant="outline" className="flex-1">Limpar</Button>
                    <Button onClick={confirmar} disabled={confirmando} className="flex-1">
                      {confirmando ? "Registrando…" : "Marcar como vendido"}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-center text-sm text-muted">
                  {opcoes.length === 0 ? "Nenhum produto à venda." : "Selecione um produto acima para ver os detalhes."}
                </p>
              )}
            </div>

            {/* Vendas de hoje — recolhida por padrão; mostra só as recentes + busca */}
            {qtd > 0 && (
              <div className="mt-4 rounded-2xl border border-line bg-white">
                <button onClick={() => setVerHoje((v) => !v)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
                  <span className="font-display text-[16px] font-semibold">Vendas de hoje ({qtd})</span>
                  <span className="flex items-center gap-2 text-sm text-muted">
                    {brl(total)}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className={`transition-transform ${verHoje ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
                  </span>
                </button>
                {verHoje && (
                  <div className="border-t border-line p-3">
                    {qtd > MOSTRAR && (
                      <input value={buscaHoje} onChange={(e) => setBuscaHoje(e.target.value)}
                        placeholder="Buscar uma venda para desfazer…"
                        className="mb-2 w-full rounded-lg border border-line bg-surface px-3 py-2 text-[13.5px] outline-none focus:border-green" />
                    )}
                    <div>
                      {hojeMostradas.map((p) => (
                        <div key={p.id} className="flex items-center justify-between gap-3 border-b border-line px-2 py-3 last:border-b-0">
                          <div className="min-w-0">
                            <div className="truncate text-[14.5px] font-medium">{p.nome}</div>
                            <div className="text-[12.5px] text-muted"><span className="font-mono">{p.codigo}</span> · {hora(p.vendido_em)} · {brl(valorDe(p))} · {formaLabel(p.forma_pagamento)}</div>
                          </div>
                          <button onClick={() => pedirDesfazer(p)}
                            className="flex-none rounded-lg border border-[#f0d3d2] px-3 py-1.5 text-[13px] font-semibold text-vend hover:bg-vend-bg">
                            Desfazer
                          </button>
                        </div>
                      ))}
                    </div>
                    {hojeFiltradas.length > MOSTRAR && (
                      <p className="px-2 pt-3 text-center text-xs text-muted">
                        Mostrando as {MOSTRAR} mais recentes de {hojeFiltradas.length}. Use a busca acima para encontrar outras.
                      </p>
                    )}
                    {hojeFiltradas.length === 0 && (
                      <p className="px-2 py-4 text-center text-sm text-muted">Nenhuma venda encontrada.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
