# Bazar Beneficente — Cenáculo Espírita Thiago Maior

Catálogo digital com reserva pelo WhatsApp. Sem carrinho, sem pagamento online, sem checkout.
Feito para voluntários administrarem sem conhecimento técnico.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres + Auth + Storage) · deploy na Vercel.

---

## O que já vem pronto

- Páginas públicas: **Início, Produtos (busca + filtros), Produto (Reserva Inteligente), Nossa História, Como Doar, Contato**
- **Reserva Inteligente**: código automático `BAZ-000001` + mensagem de WhatsApp pré-preenchida (código, nome, valor, link, data)
- Painel do voluntário: **login, dashboard, aba de vendas rápida (PDV), cadastro/edição de produto e relatório de arrecadação** com upload de fotos (conversão automática para WebP)
- SEO: metadata, Open Graph, `sitemap.xml`, `robots.txt`, canonical e **JSON-LD** (Schema.org Product)
- Acessibilidade: foco visível, navegação por teclado, `prefers-reduced-motion`, textos alternativos
- Banco com **RLS** (leitura pública, escrita só autenticada) e Storage configurado

---

## Passo a passo (≈ 30 min)

### 1. Pré-requisitos
- Node.js 18+ instalado
- Conta gratuita na [Supabase](https://supabase.com) e na [Vercel](https://vercel.com)

### 2. Instalar
```bash
npm install
```

### 3. Criar o projeto no Supabase
1. Crie um novo projeto em supabase.com.
2. Vá em **SQL Editor** → cole o conteúdo de `supabase/schema.sql` → **Run**.
3. (Opcional) Cole `supabase/seed.sql` → **Run** para ter categorias e produtos de exemplo.
4. Em **Project Settings → API**, copie a **Project URL** e a chave **anon public**.

### 4. Configurar variáveis
Copie `.env.example` para `.env.local` e preencha:
```bash
cp .env.example .env.local
```
```
NEXT_PUBLIC_SUPABASE_URL=...        # Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # anon public key
NEXT_PUBLIC_SITE_URL=https://seudominio.com.br
NEXT_PUBLIC_WHATSAPP=5531999999999  # 55 + DDD + numero
NEXT_PUBLIC_INSTAGRAM=https://instagram.com/...
NEXT_PUBLIC_EMAIL=bazar@cenaculo.org.br
```

### 4b. Editar tudo pelo painel (sem mexer em código)
Depois de publicado, os administradores acessam **/admin/config** para trocar
WhatsApp, e-mail, endereço, horários, textos e a **foto do topo** — direto do celular.
Essas configurações ficam na tabela `configuracoes` (já criada pelo `schema.sql`) e o
site passa a usá-las no lugar do `.env`. O `.env` continua servindo de valor inicial.

### 5. Criar o login da casa (senha do painel)
No Supabase → **Authentication → Users → Add user**. Crie **um login compartilhado**
para a equipe, por exemplo:
- **E-mail:** `bazar@thiagomaior.com.br` (ou o e-mail que preferir)
- **Senha:** `cetem2026`  ← esta é a senha que protege as Configurações

Compartilhe esse login apenas com os voluntários da casa. É esse e-mail + senha que
abrem o painel em `/admin` e a tela de Configurações em `/admin/config`. Para trocar a
senha depois, é só editar o usuário no mesmo lugar (Authentication → Users).

### 6. Rodar localmente
```bash
npm run dev
```
Abra http://localhost:3000 (site) e http://localhost:3000/admin (painel).

### 7. Publicar na Vercel
1. Suba o projeto para um repositório no GitHub.
2. Na Vercel → **Add New → Project** → importe o repositório.
3. Em **Environment Variables**, cole as mesmas variáveis do `.env.local`.
4. **Deploy**. Pronto.

---

## Como trocar textos e dados da instituição
Quase tudo (nome, WhatsApp, endereço, horários, redes) está centralizado em
**`src/lib/config.ts`** e nas variáveis de ambiente. Não é preciso mexer em outro lugar.

## Estrutura
```
src/
  app/                 páginas (App Router)
    produtos/[codigo]  página do produto + JSON-LD
    admin/             login, dashboard, cadastro
    sitemap.ts robots.ts
  components/          UI, cards, header, footer, catálogo
  lib/
    config.ts          << dados da instituição
    queries.ts         acesso ao banco (leitura pública)
    whatsapp.ts        Reserva Inteligente
    supabase/          clientes (public / browser / server)
  middleware.ts        protege /admin
supabase/
  schema.sql           banco completo (rode primeiro)
  seed.sql             dados de exemplo
docs/
  GUIA-DO-VOLUNTARIO.md
  DEPLOY.md
```

## Relatório de arrecadação
A tela **/admin/relatorios** soma tudo que foi vendido por período (hoje, 7 dias, mês, intervalo ou tudo), com total arrecadado, itens vendidos, ticket médio, gráfico por dia/mês, quebra por categoria e exportação em **CSV** e **PDF (imprimir)**. Os dados vêm automaticamente: quando um voluntário marca um produto como **Vendido**, o sistema carimba a data e o valor da venda.

## Notas
- O `next build` precisa das variáveis do Supabase definidas e de acesso à internet
  (as fontes são baixadas no build). Em produção na Vercel isso é automático.
- Arquitetura preparada para evoluir (PIX/cartão, estoque, área do comprador etc.) —
  veja `docs/DEPLOY.md` → seção "Evoluções futuras".
