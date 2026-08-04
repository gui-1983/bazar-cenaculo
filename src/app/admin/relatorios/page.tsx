"use client";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { brl } from "@/lib/utils";
import type { Produto } from "@/lib/types";
import { config } from "@/lib/config";

type Preset = "hoje" | "7d" | "mes" | "tudo" | "custom";
const valorDe = (p: Produto) => (p.valor_final ?? p.preco) || 0;
function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}
const iso = (d: Date) => d.toISOString().slice(0, 10);

export default function Relatorios() {
  const sb = supabaseBrowser();
  const [vendas, setVendas] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [preset, setPreset] = useState<Preset>("mes");
  const hoje = new Date();
  const [de, setDe] = useState(iso(new Date(hoje.getFullYear(), hoje.getMonth(), 1)));
  const [ate, setAte] = useState(iso(hoje));

  useEffect(() => {
    sb.from("vw_produtos").select("*").eq("status", "vendido").not("vendido_em", "is", null)
      .order("vendido_em", { ascending: false })
      .then(({ data }) => { setVendas((data as Produto[]) ?? []); setCarregando(false); });
  }, [sb]);

  // intervalo efetivo conforme o preset
  const [ini, fim] = useMemo(() => {
    const f = new Date(); f.setHours(23, 59, 59, 999);
    const i = new Date();
    if (preset === "hoje") i.setHours(0, 0, 0, 0);
    else if (preset === "7d") { i.setDate(i.getDate() - 6); i.setHours(0, 0, 0, 0); }
    else if (preset === "mes") { i.setDate(1); i.setHours(0, 0, 0, 0); }
    else if (preset === "custom") return [new Date(`${de}T00:00:00`), new Date(`${ate}T23:59:59`)];
    else return [new Date(0), f]; // tudo
    return [i, f];
  }, [preset, de, ate]);

  const filtradas = useMemo(
    () => vendas.filter((p) => { const d = new Date(p.vendido_em!); return d >= ini && d <= fim; }),
    [vendas, ini, fim]
  );

  const total = filtradas.reduce((s, p) => s + valorDe(p), 0);
  const qtd = filtradas.length;
  const ticket = qtd ? total / qtd : 0;

  // agrupamento temporal (por dia; por mês se o intervalo for longo)
  const porMes = (fim.getTime() - ini.getTime()) / 86400000 > 62;
  const serie = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of filtradas) {
      const d = new Date(p.vendido_em!);
      const chave = porMes
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        : iso(d);
      m.set(chave, (m.get(chave) ?? 0) + valorDe(p));
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtradas, porMes]);
  const maxSerie = Math.max(1, ...serie.map((s) => s[1]));

  // quebra por categoria
  const porCategoria = useMemo(() => {
    const m = new Map<string, { valor: number; qtd: number }>();
    for (const p of filtradas) {
      const k = p.categoria_nome ?? "Sem categoria";
      const cur = m.get(k) ?? { valor: 0, qtd: 0 };
      m.set(k, { valor: cur.valor + valorDe(p), qtd: cur.qtd + 1 });
    }
    return [...m.entries()].sort((a, b) => b[1].valor - a[1].valor);
  }, [filtradas]);
  const maxCat = Math.max(1, ...porCategoria.map((c) => c[1].valor));

  const FORMAS: Record<string, string> = { dinheiro: "Dinheiro", pix: "Pix", credito: "Crédito", debito: "Débito" };
  const formaLabel = (v: string | null) => (v ? FORMAS[v] ?? v : "Não informado");
  const porForma = useMemo(() => {
    const m = new Map<string, { valor: number; qtd: number }>();
    for (const p of filtradas) {
      const k = formaLabel(p.forma_pagamento);
      const cur = m.get(k) ?? { valor: 0, qtd: 0 };
      m.set(k, { valor: cur.valor + valorDe(p), qtd: cur.qtd + 1 });
    }
    return [...m.entries()].sort((a, b) => b[1].valor - a[1].valor);
  }, [filtradas]);

  const rotulo = (k: string) =>
    porMes
      ? new Date(`${k}-01T12:00:00`).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
      : new Date(`${k}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  const nomePeriodo =
    preset === "hoje" ? "Hoje" : preset === "7d" ? "Últimos 7 dias" :
    preset === "mes" ? "Este mês" : preset === "tudo" ? "Todo o período" :
    `${new Date(`${de}T12:00:00`).toLocaleDateString("pt-BR")} a ${new Date(`${ate}T12:00:00`).toLocaleDateString("pt-BR")}`;

  async function baixarPDF() {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const Hpg = doc.internal.pageSize.getHeight();
    const M = 15;
    const azul: [number, number, number] = [44, 120, 189];
    const dark: [number, number, number] = [22, 33, 28];
    const cinza: [number, number, number] = [110, 120, 116];

    // logo: círculo azul + pássaro branco
    try {
      const logo = await loadImg("/logo-bird.png");
      doc.setFillColor(azul[0], azul[1], azul[2]);
      doc.circle(M + 6, 19, 6, "F");
      doc.addImage(logo, "PNG", M + 2.6, 15.7, 6.8, 6.6);
    } catch {}

    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(cinza[0], cinza[1], cinza[2]);
    doc.text(config.instituicao, M + 16, 17);
    doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text("Relatório de arrecadação", M + 16, 24);

    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(cinza[0], cinza[1], cinza[2]);
    doc.text(nomePeriodo, W - M, 17, { align: "right" });
    doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")}`, W - M, 22, { align: "right" });

    doc.setDrawColor(226, 234, 230); doc.setLineWidth(0.3); doc.line(M, 30, W - M, 30);

    // KPIs
    const kpis = [["Total arrecadado", brl(total)], ["Itens vendidos", String(qtd)], ["Ticket médio", brl(ticket)]];
    const gap = 4; const bw = (W - 2 * M - 2 * gap) / 3; const by = 36; const bh = 20;
    kpis.forEach((k, i) => {
      const x = M + i * (bw + gap);
      doc.setFillColor(245, 248, 246); doc.roundedRect(x, by, bw, bh, 2, 2, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(cinza[0], cinza[1], cinza[2]);
      doc.text(k[0], x + 5, by + 7);
      doc.setFontSize(15); doc.setTextColor(dark[0], dark[1], dark[2]);
      doc.text(k[1], x + 5, by + 15);
    });

    let y = by + bh + 9;
    const head = (t: string) => { doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(dark[0], dark[1], dark[2]); doc.text(t, M, y); };
    const miniTabela = {
      theme: "plain" as const, margin: { left: M, right: M },
      headStyles: { fillColor: [238, 243, 240] as [number, number, number], textColor: dark, fontStyle: "bold" as const, fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: dark }, columnStyles: { 1: { halign: "right" as const }, 2: { halign: "right" as const } },
    };

    head("Por categoria");
    autoTable(doc, { ...miniTabela, startY: y + 2, head: [["Categoria", "Qtd", "Valor"]],
      body: porCategoria.map(([n, d]) => [n, String(d.qtd), brl(d.valor)]) });
    y = (doc as any).lastAutoTable.finalY + 9;

    head("Por forma de pagamento");
    autoTable(doc, { ...miniTabela, startY: y + 2, head: [["Forma", "Qtd", "Valor"]],
      body: porForma.map(([n, d]) => [n, String(d.qtd), brl(d.valor)]) });
    y = (doc as any).lastAutoTable.finalY + 9;

    head(`Itens vendidos (${qtd})`);
    autoTable(doc, {
      startY: y + 2, margin: { left: M, right: M },
      head: [["Código", "Produto", "Categoria", "Forma", "Data", "Valor"]],
      body: filtradas.map((p) => [p.codigo, p.nome, p.categoria_nome ?? "—", formaLabel(p.forma_pagamento),
        new Date(p.vendido_em!).toLocaleDateString("pt-BR"), brl(valorDe(p))]),
      foot: [["", "", "", "", "Total", brl(total)]],
      theme: "striped",
      headStyles: { fillColor: azul, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
      bodyStyles: { fontSize: 8.5, textColor: dark },
      footStyles: { fillColor: [245, 248, 246], textColor: dark, fontStyle: "bold", fontSize: 9 },
      alternateRowStyles: { fillColor: [249, 251, 250] },
      columnStyles: { 0: { cellWidth: 22 }, 5: { halign: "right" } },
      didDrawPage: () => {
        doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(cinza[0], cinza[1], cinza[2]);
        doc.text(`${config.instituicao} · Bazar Beneficente`, M, Hpg - 8);
        doc.text("Página " + doc.getNumberOfPages(), W - M, Hpg - 8, { align: "right" });
      },
    });

    doc.save(`relatorio-arrecadacao-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  function baixarCSV() {
    const linhas = [
      ["Código", "Produto", "Categoria", "Forma", "Valor (R$)", "Data da venda"],
      ...filtradas.map((p) => [
        p.codigo, p.nome, p.categoria_nome ?? "", formaLabel(p.forma_pagamento),
        valorDe(p).toFixed(2).replace(".", ","),
        new Date(p.vendido_em!).toLocaleDateString("pt-BR"),
      ]),
      [], ["TOTAL", "", "", "", total.toFixed(2).replace(".", ","), `${qtd} itens`],
    ];
    const csv = "\uFEFF" + linhas.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url; a.download = `arrecadacao-${iso(new Date())}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-6 md:grid-cols-[230px_1fr]">
      <div className="print:hidden"><AdminSidebar active="relatorios" /></div>

      <div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold">Relatório de arrecadação</h1>
            <p className="mt-0.5 text-sm text-muted">{nomePeriodo}</p>
          </div>
          <div className="no-print flex gap-2">
            <button onClick={baixarCSV} className="rounded-xl border border-line bg-white px-3.5 py-2 text-sm font-semibold hover:bg-surface">⬇ CSV</button>
            <button onClick={baixarPDF} className="rounded-xl border border-line bg-white px-3.5 py-2 text-sm font-semibold hover:bg-surface">📄 Baixar PDF</button>
          </div>
        </div>

        {/* Seletor de período */}
        <div className="no-print mt-4 flex flex-wrap items-center gap-2">
          {([["hoje", "Hoje"], ["7d", "7 dias"], ["mes", "Este mês"], ["tudo", "Tudo"], ["custom", "Escolher datas"]] as [Preset, string][]).map(([k, l]) => (
            <button key={k} onClick={() => setPreset(k)}
              className={`rounded-full border px-3.5 py-1.5 text-[13.5px] font-semibold transition-colors ${
                preset === k ? "border-green bg-green text-white" : "border-line bg-white text-muted hover:bg-surface"
              }`}>{l}</button>
          ))}
          {preset === "custom" && (
            <span className="flex items-center gap-2 text-sm">
              <input type="date" value={de} onChange={(e) => setDe(e.target.value)} className="rounded-lg border border-line bg-surface px-2.5 py-1.5" />
              <span className="text-muted">até</span>
              <input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="rounded-lg border border-line bg-surface px-2.5 py-1.5" />
            </span>
          )}
        </div>

        {carregando ? (
          <div className="mt-6 rounded-2xl border border-line bg-white p-10 text-center text-sm text-muted">Carregando…</div>
        ) : (
          <>
            {/* KPIs */}
            <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              <Kpi titulo="Total arrecadado" valor={brl(total)} destaque />
              <Kpi titulo="Itens vendidos" valor={String(qtd)} />
              <Kpi titulo="Ticket médio" valor={brl(ticket)} />
            </div>

            {/* Gráfico por período */}
            <Bloco titulo={`Arrecadação por ${porMes ? "mês" : "dia"}`}>
              {serie.length === 0 ? (
                <Vazio />
              ) : (
                <div className="flex items-end gap-1.5 overflow-x-auto pb-1" style={{ minHeight: 150 }}>
                  {serie.map(([k, v]) => (
                    <div key={k} className="flex min-w-[34px] flex-1 flex-col items-center gap-1.5">
                      <span className="text-[10.5px] font-semibold text-muted">{v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}</span>
                      <div className="w-full rounded-t-md bg-green transition-all" style={{ height: `${Math.max(4, (v / maxSerie) * 120)}px` }} title={brl(v)} />
                      <span className="whitespace-nowrap text-[10.5px] text-muted">{rotulo(k)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Bloco>

            {/* Por categoria */}
            <Bloco titulo="Por categoria">
              {porCategoria.length === 0 ? <Vazio /> : (
                <div className="space-y-3">
                  {porCategoria.map(([nome, d]) => (
                    <div key={nome}>
                      <div className="mb-1 flex justify-between text-[13.5px]">
                        <span className="font-medium">{nome} <span className="text-muted">· {d.qtd}</span></span>
                        <b className="font-semibold">{brl(d.valor)}</b>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-surface2">
                        <div className="h-full rounded-full bg-green" style={{ width: `${(d.valor / maxCat) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Bloco>

            {/* Por forma de pagamento */}
            <Bloco titulo="Por forma de pagamento">
              {porForma.length === 0 ? <Vazio /> : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {porForma.map(([nome, d]) => (
                    <div key={nome} className="rounded-xl border border-line bg-surface p-3.5">
                      <div className="text-[12.5px] font-semibold text-muted">{nome} · {d.qtd}</div>
                      <div className="mt-0.5 font-display text-[19px] font-bold">{brl(d.valor)}</div>
                    </div>
                  ))}
                </div>
              )}
            </Bloco>

            {/* Tabela */}
            <Bloco titulo={`Itens vendidos (${qtd})`}>
              {filtradas.length === 0 ? <Vazio /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13.5px]">
                    <thead>
                      <tr className="border-b border-line text-muted">
                        <th className="py-2 pr-3 font-semibold">Código</th>
                        <th className="py-2 pr-3 font-semibold">Produto</th>
                        <th className="py-2 pr-3 font-semibold">Categoria</th>
                        <th className="py-2 pr-3 font-semibold">Forma</th>
                        <th className="py-2 pr-3 font-semibold">Data</th>
                        <th className="py-2 text-right font-semibold">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtradas.map((p) => (
                        <tr key={p.id} className="border-b border-line last:border-b-0">
                          <td className="py-2 pr-3 font-mono text-[12.5px]">{p.codigo}</td>
                          <td className="py-2 pr-3">{p.nome}</td>
                          <td className="py-2 pr-3 text-muted">{p.categoria_nome ?? "—"}</td>
                          <td className="py-2 pr-3 text-muted">{formaLabel(p.forma_pagamento)}</td>
                          <td className="py-2 pr-3 text-muted">{new Date(p.vendido_em!).toLocaleDateString("pt-BR")}</td>
                          <td className="py-2 text-right font-semibold">{brl(valorDe(p))}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-line">
                        <td colSpan={5} className="py-2.5 font-semibold">Total</td>
                        <td className="py-2.5 text-right font-display text-base font-bold text-green">{brl(total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </Bloco>
          </>
        )}
      </div>
    </div>
  );
}

function Kpi({ titulo, valor, destaque }: { titulo: string; valor: string; destaque?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${destaque ? "border-green/30 bg-green-soft" : "border-line bg-white"}`}>
      <div className="text-[13px] font-semibold text-muted">{titulo}</div>
      <div className={`mt-1 font-display text-[28px] font-bold ${destaque ? "text-green-600" : ""}`}>{valor}</div>
    </div>
  );
}
function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-4 rounded-2xl border border-line bg-white p-5">
      <h2 className="mb-4 font-display text-[17px] font-semibold">{titulo}</h2>
      {children}
    </section>
  );
}
function Vazio() {
  return <p className="py-6 text-center text-sm text-muted">Nenhuma venda registrada neste período.</p>;
}
