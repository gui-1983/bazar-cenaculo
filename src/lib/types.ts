export type ProdutoStatus = "disponivel" | "reservado" | "vendido" | "oculto";

export interface Categoria {
  id: string;
  nome: string;
  slug: string;
  icone: string | null;
  imagem_url: string | null;
  ordem: number;
}

export interface Produto {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  categoria_id: string | null;
  estado: string | null;
  preco: number;
  quantidade: number;
  status: ProdutoStatus;
  destaque: boolean;
  dimensoes: string | null;
  observacoes: string | null;
  visualizacoes: number;
  criado_em: string;
  atualizado_em: string;
  vendido_em: string | null;
  valor_final: number | null;
  forma_pagamento: string | null;
  reserva_origem: string | null;
  reservado_em: string | null;
  reserva_expira_em: string | null;
  reserva_revisado_em: string | null;
  reserva_obs: string | null;
  // vindos da view vw_produtos:
  categoria_nome?: string | null;
  categoria_slug?: string | null;
  categoria_icone?: string | null;
  imagem_principal?: string | null;
}

export interface ProdutoImagem {
  id: string;
  produto_id: string;
  url: string;
  ordem: number;
  principal: boolean;
}
