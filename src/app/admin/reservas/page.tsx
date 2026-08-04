"use client";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { brl } from "@/lib/utils";
import { Button } from "@/components/ui";
import type { Produto } from "@/lib/types";

const H48 = 48 * 3600 * 1000;
const agora = () => Date.now();
const horas = (ms: number) => Math.floor(ms / 3600000);
const minutos = (ms: number) => Math.floor((ms % 3600000) / 60000);

export default function Reservas() {
  const sb = supabaseBrowser();
  const [disponiveis, setDisponiveis] = useState<Produto[]>([]);
  const [reservas, setReservas] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [selId, setSelId] = useState("");
  const [obs, setObs] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [, force] = useState(0); // re-render para atualizar contagens

  useEffect(() => {
    async function carregar() {
      await sb.rpc("expirar_reservas"); // limpa reservas de cliente vencidas
      const { data: disp } = await sb.from("vw_produtos").select("*").eq("status", "disponivel").order("nome");
      setDisponiveis((disp as Produto[]) ?? []);
      const { data: res } = await sb.from("vw_produtos").select("*").eq("status", "reservado")
        .order("reservado_em", { ascending: false });
      setReservas((res as Produto[]) ?? []);
      setCarregando(false);
    }
    carregar();
    const t = setInterval(() => force((n) => n + 1), 60000); // atualiza prazos a cada min
    return () => clearInterval(t);
  }, [sb]);

  const opcoes = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return q ? disponiveis.filter((p) => p.nome.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)) : disponiveis;
  }, [disponiveis, busca]);
  const sel = useMemo(() => disponiveis.find((p) => p.id === selId) ?? null, [disponiveis, selId]);

  const precisaRevisar = (p: Produto) =>
    p.reserva_origem === "voluntario" &&
    agora() - new Date(p.reserva_revisado_em ?? p.reservado_em ?? Date.now()).getTime() > H48;
  const nRevisar = reservas.filter(precisaRevisar).length;

  async function reservar() {
    if (!sel) return;
    setSalvando(true);
    const { error } = await sb.from("produtos").update({
      status: "reservado", reserva_origem: "voluntario", reservado_em: new Date().toISOString(),
      reserva_expira_em: null, reserva_revisado_em: null, reserva_obs: obs || null,
    }).eq("id", sel.id);
    setSalvando(false);
    if (error) { setFlash("Erro ao reservar: " + error.message); return; }
    const r: Produto = { ...sel, status: "reservado", reserva_origem: "voluntario",
      reservado_em: new Date().toISOString(), reserva_expira_em: null, reserva_revisado_em: null, reserva_obs: obs || null };
    setDisponiveis((prev) => prev.filter((x) => x.id !== sel.id));
    setReservas((prev) => [r, ...prev]);
    setFlash(`Reservado: ${sel.nome}${obs ? ` (para ${obs})` : ""}`);
    setSelId(""); setObs("");
    setTimeout(() => setFlash(null), 3500);
  }

  async function liberar(p: Produto) {
    if (!confirm(`Liberar "${p.nome}"? Ele volta a ficar disponível no site.`)) return;
    const { error } = await sb.from("produtos").update({
      status: "disponivel", reserva_origem: null, reservado_em: null,
      reserva_expira_em: null, reserva_revisado_em: null, reserva_obs: null,
    }).eq("id", p.id);
    if (error) { setFlash("Erro: " + error.message); return; }
    setReservas((prev) => prev.filter((x) => x.id !== p.id));
    setDisponiveis((prev) => [...prev, { ...p, status: "disponivel" } as Produto].sort((a, b) => a.nome.localeCompare(b.nome)));
    setFlash(`${p.nome} voltou para disponível.`);
    setTimeout(() => setFlash(null), 3500);
  }

  async function manter(p: Produto) {
    const iso = new Date().toISOString();
    const { error } = await sb.from("produtos").update({ reserva_revisado_em: iso }).eq("id", p.id);
    if (error) { setFlash("Erro: " + error.message); return; }
    setReservas((prev) => prev.map((x) => (x.id === p.id ? { ...x, reserva_revisado_em: iso } : x)));
    setFlash(`Reserva de ${p.nome} mantida.`);
    setTimeout(() => setFlash(null), 3500);
  }

  return (
    <div className="grid gap-6 md:grid-cols-[230px_1fr]">
      <AdminSidebar active="reservas" />
      <div className="max-w-[600px]">
        <h1 className="font-display text-2xl font-semibold">Reservas</h1>
        <p className="mb-4 mt-0.5 text-sm text-muted">Separe um item para alguém e acompanhe os prazos.</p>

        {flash && <div className="mb-4 rounded-xl border border-green/30 bg-green-soft px-4 py-2.5 text-sm font-medium text-green-600">✓ {flash}</div>}

        {nRevisar > 0 && (
          <div className="mb-4 rounded-xl border border-[#f4e2bd] bg-res-bg px-4 py-3 text-sm text-res">
            ⏰ {nRevisar} reserva(s) de voluntário passaram de 48h e precisam de revisão (abaixo).
          </div>
        )}

        {/* Reservar um produto (voluntário) */}
        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-display text-[17px] font-semibold">Reservar um produto</h2>
          <p className="mb-3 mt-0.5 text-[13px] text-muted">Reserva feita pela casa não tem prazo — só um lembrete de revisão após 48h.</p>
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou código…"
            className="mb-3 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[14.5px] outline-none focus:border-green" />
          <select value={selId} onChange={(e) => { setSelId(e.target.value); }}
            className="w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-[15px] outline-none focus:border-green">
            <option value="">— selecione um produto ({opcoes.length}) —</option>
            {opcoes.map((p) => <option key={p.id} value={p.id}>{p.nome} — {brl(p.preco)} ({p.codigo})</option>)}
          </select>
          {sel && (
            <div className="mt-4 border-t border-line pt-4">
              <label className="mb-1.5 block text-[13.5px] font-semibold">Reservado para (opcional)</label>
              <input value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Nome ou telefone de quem reservou"
                className="mb-4 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[14.5px] outline-none focus:border-green" />
              <div className="flex gap-2.5">
                <Button onClick={() => { setSelId(""); setObs(""); }} variant="outline" className="flex-1">Limpar</Button>
                <Button onClick={reservar} disabled={salvando} className="flex-1">{salvando ? "Reservando…" : "Marcar como reservado"}</Button>
              </div>
            </div>
          )}
        </div>

        {/* Reservas ativas */}
        <h2 className="mb-3 mt-6 font-display text-lg font-semibold">Reservas ativas ({reservas.length})</h2>
        {carregando ? (
          <div className="rounded-2xl border border-line bg-white p-8 text-center text-sm text-muted">Carregando…</div>
        ) : reservas.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-8 text-center text-sm text-muted">Nenhuma reserva ativa.</div>
        ) : (
          <div className="space-y-2.5">
            {reservas.map((p) => {
              const cliente = p.reserva_origem === "cliente";
              const msLeft = p.reserva_expira_em ? new Date(p.reserva_expira_em).getTime() - agora() : 0;
              const revisar = precisaRevisar(p);
              return (
                <div key={p.id} className={`rounded-2xl border bg-white p-4 ${revisar ? "border-[#e6c15a]" : "border-line"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{p.nome}</div>
                      <div className="mt-0.5 text-[12.5px] text-muted">
                        <span className="font-mono">{p.codigo}</span> · {brl(p.preco)}
                        {p.reserva_obs && <> · para {p.reserva_obs}</>}
                      </div>
                    </div>
                    <span className={`flex-none rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${cliente ? "bg-res-bg text-res" : "bg-surface2 text-muted"}`}>
                      {cliente ? "Cliente" : "Voluntário"}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[13px] text-muted">
                      {cliente
                        ? (msLeft > 0
                            ? <>⏳ expira em <b className="text-res">{horas(msLeft)}h {minutos(msLeft)}min</b></>
                            : <>⏳ <b className="text-res">expirada</b> — atualize a página para liberar</>)
                        : (revisar
                            ? <>⏰ <b className="text-res">reservada há mais de 48h</b> — ainda está reservada?</>
                            : <>sem prazo · reservada há {horas(agora() - new Date(p.reservado_em ?? Date.now()).getTime())}h</>)}
                    </span>
                    <div className="flex gap-2">
                      {!cliente && revisar && (
                        <button onClick={() => manter(p)} className="rounded-lg border border-line bg-white px-3 py-1.5 text-[13px] font-semibold hover:bg-surface">Manter</button>
                      )}
                      <button onClick={() => liberar(p)} className="rounded-lg border border-[#f0d3d2] px-3 py-1.5 text-[13px] font-semibold text-vend hover:bg-vend-bg">Liberar</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="mt-4 text-center text-xs text-muted">Para vender um item reservado, use a aba 🛒 Vendas (reservados aparecem lá).</p>
      </div>
    </div>
  );
}
