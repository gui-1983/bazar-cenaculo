import type { Metadata } from "next";
import { getProdutos, getCategorias } from "@/lib/queries";
import { CatalogClient } from "@/components/catalog/CatalogClient";

export const revalidate = 0; // sempre buscar dados frescos (produto novo aparece na hora)
export const metadata: Metadata = {
  title: "Produtos",
  description: "Explore os itens disponíveis no Bazar Beneficente e reserve pelo WhatsApp.",
};

export default async function ProdutosPage() {
  const [produtos, categorias] = await Promise.all([getProdutos(), getCategorias()]);
  return (
    <div className="mx-auto max-w-[1120px] px-[22px]">
      <h1 className="sr-only">Produtos do Bazar Beneficente</h1>
      <CatalogClient produtos={produtos} categorias={categorias} />
    </div>
  );
}
