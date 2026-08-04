import Link from "next/link";
import { cn, STATUS_LABEL } from "@/lib/utils";
import type { ProdutoStatus } from "@/lib/types";
import type { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "outline" | "whatsapp";
  size?: "md" | "lg";
  className?: string;
  external?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all disabled:opacity-60 disabled:pointer-events-none";
const variants = {
  primary: "bg-green text-white hover:bg-green-600 hover:-translate-y-0.5",
  outline: "bg-white text-ink border border-line hover:bg-surface hover:-translate-y-0.5",
  whatsapp: "bg-[#25D366] text-[#08331c] hover:bg-[#1fbf5b] hover:-translate-y-0.5",
};
const sizes = { md: "px-4 py-2.5 text-sm", lg: "px-6 py-3.5 text-base" };

export function Button({
  children, href, variant = "primary", size = "md",
  className, external, onClick, type = "button", disabled,
}: ButtonProps) {
  const cls = cn(base, variants[variant], sizes[size], className);
  if (href && !disabled) {
    return external ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{children}</a>
    ) : (
      <Link href={href} className={cls}>{children}</Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

export function StatusBadge({ status }: { status: ProdutoStatus }) {
  const s = STATUS_LABEL[status];
  const dot = { disponivel: "#1f9d6b", reservado: "#c98a05", vendido: "#b0413e", oculto: "#94a3b8" }[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", s.cls)}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
      {s.label}
    </span>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return <span className="tag">{children}</span>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-green-soft px-3 py-1.5 text-[13px] font-semibold text-green-600">
      {children}
    </span>
  );
}
