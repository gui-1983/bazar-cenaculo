import Link from "next/link";
import { Logo } from "@/components/site/Logo";
import { SairButton } from "./SairButton";

export function AdminSidebar({ active }: { active: string }) {
  const items = [
    { href: "/admin", label: "📊 Início", key: "inicio" },
    { href: "/admin/vendas", label: "🛒 Vendas", key: "vendas" },
    { href: "/admin/reservas", label: "🔖 Reservas", key: "reservas" },
    { href: "/admin/produtos", label: "📦 Produtos", key: "produtos" },
    { href: "/admin/produtos/novo", label: "➕ Novo produto", key: "novo" },
    { href: "/admin/relatorios", label: "📈 Relatórios", key: "relatorios" },
    { href: "/admin/config", label: "⚙️ Configurações", key: "config" },
  ];
  return (
    <aside className="rounded-2xl border border-line bg-surface p-4 md:sticky md:top-6 md:self-start">
      <div className="mb-4 flex items-center gap-2.5 px-1">
        <Logo size={32} />
        <b className="font-display text-sm">Painel</b>
      </div>
      <nav className="flex gap-1 overflow-x-auto md:flex-col">
        {items.map((i) => (
          <Link key={i.key} href={i.href}
            className={`whitespace-nowrap rounded-lg px-3 py-2.5 text-[14.5px] font-medium transition-colors ${
              active === i.key ? "bg-white text-ink shadow-soft" : "text-muted hover:bg-white"
            }`}>
            {i.label}
          </Link>
        ))}
      </nav>
      <SairButton />
    </aside>
  );
}
