import { supabasePublic } from "./supabase/public";
import type { Produto, Categoria } from "./types";

// --- CATÁLOGO PÚBLICO (usado nos Server Components) ---

export async function getCategorias(): Promise<Categoria[]> {
  const sb = supabasePublic();
  const { data } = await sb.from("categorias").select("*").order("ordem");
  return data ?? [];
}

export async function getProdutos(opts?: {
  categoria?: string;
  destaque?: boolean;
  limit?: number;
}): Promise<Produto[]> {
  const sb = supabasePublic();
  let q = sb
    .from("vw_produtos")
    .select("*")
    .neq("status", "oculto")
    .order("criado_em", { ascending: false });

  if (opts?.categoria) q = q.eq("categoria_slug", opts.categoria);
  if (opts?.destaque) q = q.eq("destaque", true);
  if (opts?.limit) q = q.limit(opts.limit);

  const { data } = await q;
  return (data as Produto[]) ?? [];
}

export async function getProdutoPorCodigo(codigo: string): Promise<Produto | null> {
  const sb = supabasePublic();
  const { data } = await sb
    .from("vw_produtos")
    .select("*")
    .eq("codigo", codigo)
    .neq("status", "oculto")
    .maybeSingle();
  return (data as Produto) ?? null;
}

export async function getImagensProduto(produtoId: string): Promise<string[]> {
  const sb = supabasePublic();
  const { data } = await sb
    .from("produto_imagens")
    .select("url")
    .eq("produto_id", produtoId)
    .order("ordem");
  return ((data as { url: string }[]) ?? []).map((r) => r.url).filter(Boolean);
}

export async function getSemelhantes(codigo: string, categoriaSlug?: string | null) {
  const sb = supabasePublic();
  let q = sb
    .from("vw_produtos")
    .select("*")
    .neq("codigo", codigo)
    .neq("status", "oculto")
    .limit(4);
  if (categoriaSlug) q = q.eq("categoria_slug", categoriaSlug);
  const { data } = await q;
  return (data as Produto[]) ?? [];
}

export async function registrarVisualizacao(codigo: string) {
  const sb = supabasePublic();
  await sb.rpc("incrementar_visualizacoes", { p_codigo: codigo });
}

// =====================================================================
//  CONFIGURAÇÃO EFETIVA DO SITE
//  Lê a linha única de `configuracoes`; onde estiver vazio, usa o .env.
//  `cache` deduplica a leitura dentro da mesma requisição.
// =====================================================================
import { cache } from "react";
import { config as defaults } from "./config";

export type SiteConfig = {
  nomeSite: string;
  instituicao: string;
  descricao: string;
  whatsapp: string;
  email: string;
  instagram: string;
  endereco: string;
  horario: string;
  siteUrl: string;
  heroUrl: string | null;
};

export const getConfig = cache(async (): Promise<SiteConfig> => {
  const base: SiteConfig = {
    nomeSite: defaults.nomeSite,
    instituicao: defaults.instituicao,
    descricao: defaults.descricao,
    whatsapp: defaults.whatsapp,
    email: defaults.email,
    instagram: defaults.instagram,
    endereco: defaults.endereco,
    horario: defaults.horario,
    siteUrl: defaults.siteUrl,
    heroUrl: null,
  };
  try {
    const sb = supabasePublic();
    const { data } = await sb.from("configuracoes").select("*").eq("id", 1).maybeSingle();
    if (!data) return base;
    const pick = (v: unknown, fb: string) =>
      typeof v === "string" && v.trim() ? v.trim() : fb;
    return {
      ...base,
      nomeSite: pick(data.nome_site, base.nomeSite),
      instituicao: pick(data.instituicao, base.instituicao),
      descricao: pick(data.descricao, base.descricao),
      whatsapp: pick(data.whatsapp, base.whatsapp),
      email: pick(data.email, base.email),
      instagram: pick(data.instagram, base.instagram),
      endereco: pick(data.endereco, base.endereco),
      horario: pick(data.horarios, base.horario),
      heroUrl: typeof data.hero_url === "string" && data.hero_url.trim() ? data.hero_url.trim() : null,
    };
  } catch {
    return base; // tabela ainda não criada, etc.
  }
});

// =====================================================================
//  VENDAS — itens vendidos num intervalo, para o relatório de arrecadação.
//  `de` e `ate` são ISO (yyyy-mm-dd); se omitidos, traz todas as vendas.
// =====================================================================
export async function getVendas(de?: string, ate?: string): Promise<Produto[]> {
  const sb = supabasePublic();
  let q = sb
    .from("vw_produtos")
    .select("*")
    .eq("status", "vendido")
    .not("vendido_em", "is", null)
    .order("vendido_em", { ascending: false });
  if (de) q = q.gte("vendido_em", `${de}T00:00:00`);
  if (ate) q = q.lte("vendido_em", `${ate}T23:59:59`);
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []) as Produto[];
}
