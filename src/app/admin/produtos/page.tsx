import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { brl } from "@/lib/utils";
import { StatusBadge, Tag, Button } from "@/components/ui";
import type { Produto } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminProdutos() {
  const sb = supabaseServer();
  const { data } = await sb.from("vw_produtos").select("*").order("criado_em", { ascending: false });
  const produtos = (data as Produto[]) ?? [];

  return (
    <div className="grid gap-6 md:grid-cols-[230px_1fr]">
      <AdminSidebar active="produtos" />
      <div>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-semibold">Produtos</h1>
          <Button href="/admin/produtos/novo">+ Novo produto</Button>
        </div>
        <div className="mt-5 overflow-hidden rounded-2xl border border-line">
          {produtos.map((p) => (
            <Link key={p.id} href={`/admin/produtos/novo?editar=${p.id}`}
              className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-b-0 hover:bg-surface">
              <div className="flex items-center gap-3">
                <Tag>{p.codigo}</Tag>
                <div>
                  <div className="text-[14.5px] font-medium">{p.nome}</div>
                  <div className="text-xs text-muted">{p.categoria_nome ?? "Sem categoria"}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted">{brl(p.preco)}</span>
                <StatusBadge status={p.status} />
              </div>
            </Link>
          ))}
          {produtos.length === 0 && <div className="px-4 py-8 text-center text-sm text-muted">Nenhum produto cadastrado.</div>}
        </div>
      </div>
    </div>
  );
}
