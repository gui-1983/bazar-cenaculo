import type { MetadataRoute } from "next";
import { config } from "@/lib/config";
import { getProdutos } from "@/lib/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = config.siteUrl;
  const estaticas = ["", "/produtos", "/institucional", "/como-doar", "/contato"].map((p) => ({
    url: `${base}${p}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));

  const produtos = await getProdutos();
  const paginasProduto = produtos.map((p) => ({
    url: `${base}/produtos/${p.codigo}`,
    lastModified: new Date(p.atualizado_em),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...estaticas, ...paginasProduto];
}
