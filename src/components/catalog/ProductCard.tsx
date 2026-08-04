import Link from "next/link";
import Image from "next/image";
import { brl, cn } from "@/lib/utils";
import { StatusBadge, Tag } from "@/components/ui";
import type { Produto } from "@/lib/types";

export function ProductCard({ p }: { p: Produto }) {
  const vendido = p.status === "vendido";
  return (
    <Link
      href={`/produtos/${p.codigo}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl2 border border-line bg-white transition-all hover:-translate-y-1 hover:border-[#d3e0da] hover:shadow-soft",
        vendido && "opacity-[.66]"
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface">
        {p.imagem_principal ? (
          <Image
            src={p.imagem_principal}
            alt={p.nome}
            fill
            sizes="(max-width:900px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-5xl opacity-90">
            {p.categoria_icone ?? "🎁"}
          </div>
        )}
        <div className="absolute left-2.5 top-2.5">
          <StatusBadge status={p.status} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          {p.categoria_nome ?? "Bazar"}
        </span>
        <h3 className="font-display text-[17px] font-semibold leading-tight">{p.nome}</h3>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="font-display text-lg font-bold">{brl(p.preco)}</span>
          <Tag>{p.codigo}</Tag>
        </div>
      </div>
    </Link>
  );
}
