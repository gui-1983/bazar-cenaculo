// Configuração central — tudo que a instituição precisa trocar fica aqui
// (valores vêm do .env.local; há defaults com os dados oficiais da casa).
// Os administradores também editam isso pelo painel em /admin/config.
export const config = {
  instituicao: "Cenáculo Espírita Thiago Maior",
  nomeSite: "Bazar Beneficente",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  // Número que RECEBE as reservas. Padrão: Sinara (contato do bazar).
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? "5531998887499",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM ?? "https://instagram.com/thiagomaiorespirita",
  email: process.env.NEXT_PUBLIC_EMAIL ?? "thiagomaior@outlook.com",
  endereco: "Praça Milton Campos, 127 — Serra, Belo Horizonte/MG · CEP 30130-040",
  horario: "Doações nos horários de funcionamento da casa",
  descricao:
    "Toda reserva feita por este catálogo contribui para a manutenção dos projetos sociais desenvolvidos pelo Cenáculo Espírita Thiago Maior.",
};

// Contatos oficiais do bazar (doações) — publicados no site da casa.
export const contatosBazar = [
  { nome: "Sinara", whatsapp: "5531998887499", exibir: "(31) 99888-7499" },
  { nome: "Neire", whatsapp: "5531996969505", exibir: "(31) 99696-9505" },
];
