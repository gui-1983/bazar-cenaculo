import { config } from "./config";
import { brl, dataBR } from "./utils";
import type { Produto } from "./types";

type WaConfig = { whatsapp: string; siteUrl: string };
const fallback: WaConfig = { whatsapp: config.whatsapp, siteUrl: config.siteUrl };

// ===== Reserva Inteligente =====
// Monta a mensagem pré-preenchida e devolve o link wa.me pronto.
// `cfg` vem de getConfig() (número/URL editáveis no painel); sem ele, usa o .env.
export function linkReservaWhatsApp(p: Produto, cfg: WaConfig = fallback): string {
  const msg = [
    "Olá!",
    "",
    "Gostaria de reservar o seguinte produto anunciado no catálogo do Bazar Beneficente:",
    "",
    `*Código:* ${p.codigo}`,
    `*Nome:* ${p.nome}`,
    `*Valor:* ${brl(p.preco)}`,
    `*Link:* ${cfg.siteUrl}/produtos/${p.codigo}`,
    `*Data da solicitação:* ${dataBR()}`,
    "",
    "Aguardo retorno. Muito obrigado(a)!",
  ].join("\n");

  return `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(msg)}`;
}

export function linkDoacaoWhatsApp(cfg: WaConfig = fallback): string {
  const msg = "Olá! Gostaria de doar itens para o Bazar Beneficente.";
  return `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(msg)}`;
}
