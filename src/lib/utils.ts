export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const dataBR = (iso?: string) =>
  new Date(iso ?? Date.now()).toLocaleDateString("pt-BR");

export const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  disponivel: { label: "Disponível", cls: "bg-disp-bg text-[#146b48]" },
  reservado: { label: "Reservado", cls: "bg-res-bg text-[#8a5f04]" },
  vendido: { label: "Vendido", cls: "bg-vend-bg text-[#8f302e]" },
  oculto: { label: "Oculto", cls: "bg-surface2 text-muted" },
};
