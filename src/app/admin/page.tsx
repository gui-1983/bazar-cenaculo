import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { brl } from "@/lib/utils";
import { StatusBadge, Tag } from "@/components/ui";
import type { Produto } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const sb = supabaseServer();
  const { data } = await sb.from("produtos").select("*").order("criado_em", { ascending: false });
  const produtos = (data as Produto[]) ?? [];

  const c = (s: string) => produtos.filter((p) => p.status === s).length;
  const stats = [
    { k: "Cadastrados", v: produtos.length, cor: "" },
    { k: "Disponíveis", v: c("disponivel"), cor: "text-green" },
    { k: "Reservados", v: c("reservado"), cor: "text-res" },
    { k: "Vendidos", v: c("vendido"), cor: "text-vend" },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-[230px_1fr]">
      <AdminSidebar active="inicio" />
      <div>
        <h1 className="font-display text-2xl font-semibold">Resumo</h1>
        <div className="my-5 grid grid-cols-2 gap-3.5 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.k} className="rounded-2xl border border-line bg-white p-4">
              <div className="text-[13px] font-semibold text-muted">{s.k}</div>
              <div className={`mt-1 font-display text-[30px] font-bold ${s.cor}`}>{s.v}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Adicionados recentemente</h2>
          <Link href="/admin/produtos/novo" className="text-sm font-semibold text-green-600">+ Novo produto</Link>
        </div>
        <div className="mt-3 overflow-hidden rounded-2xl border border-line">
          {produtos.slice(0, 8).map((p) => (
            <Link key={p.id} href={`/admin/produtos/novo?editar=${p.id}`}
              className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-b-0 hover:bg-surface">
              <div className="flex items-center gap-3">
                <Tag>{p.codigo}</Tag>
                <span className="text-[14.5px] font-medium">{p.nome}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted">{brl(p.preco)}</span>
                <StatusBadge status={p.status} />
              </div>
            </Link>
          ))}
          {produtos.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted">
              Nenhum produto ainda. <Link href="/admin/produtos/novo" className="font-semibold text-green-600">Cadastre o primeiro →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
