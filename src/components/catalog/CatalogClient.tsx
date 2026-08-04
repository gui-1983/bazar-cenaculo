"use client";
import { useMemo, useState } from "react";
import { ProductCard } from "./ProductCard";
import { cn } from "@/lib/utils";
import type { Produto, Categoria } from "@/lib/types";

const STATUS = [
  { k: "all", label: "Todos" },
  { k: "disponivel", label: "Disponíveis" },
  { k: "reservado", label: "Reservados" },
  { k: "vendido", label: "Vendidos" },
];

export function CatalogClient({
  produtos, categorias,
}: { produtos: Produto[]; categorias: Categoria[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState("all");

  const list = useMemo(() => {
    const query = q.toLowerCase().trim();
    return produtos.filter((p) => {
      if (cat !== "all" && p.categoria_slug !== cat) return false;
      if (status !== "all" && p.status !== status) return false;
      if (query) {
        const hay = `${p.nome} ${p.codigo} ${p.descricao ?? ""} ${p.categoria_nome ?? ""}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [produtos, q, cat, status]);

  return (
    <>
      <div className="sticky top-[66px] z-20 -mx-[22px] border-b border-line bg-white/90 px-[22px] py-4 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-2.5">
            <span aria-hidden>🔍</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nome, código ou descrição…"
              aria-label="Buscar produtos"
              className="w-full bg-transparent text-[15px] outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS.map((s) => (
              <Chip key={s.k} on={status === s.k} onClick={() => setStatus(s.k)}>{s.label}</Chip>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip on={cat === "all"} onClick={() => setCat("all")}>Todas categorias</Chip>
          {categorias.map((c) => (
            <Chip key={c.slug} on={cat === c.slug} onClick={() => setCat(c.slug)}>
              {c.icone} {c.nome}
            </Chip>
          ))}
        </div>
      </div>

      <p className="mb-4 mt-6 text-sm text-muted">
        {list.length} {list.length === 1 ? "produto" : "produtos"}
      </p>

      {list.length ? (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {list.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      ) : (
        <div className="py-16 text-center text-muted">
          <div className="text-4xl">🫙</div>
          <p className="mt-3">Nenhum produto encontrado com esses filtros.<br />Tente limpar a busca ou trocar a categoria.</p>
        </div>
      )}
    </>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-2 text-[13.5px] font-semibold transition-colors",
        on ? "border-ink bg-ink text-white" : "border-line bg-white text-muted hover:border-[#cfe0d7]"
      )}
    >
      {children}
    </button>
  );
}
