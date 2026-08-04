# Deploy e evolução

## Deploy na Vercel (resumo)
1. Projeto no GitHub → importar na Vercel
2. Colar as variáveis de ambiente (as mesmas do `.env.local`)
3. Deploy automático a cada `git push`

## Publicar no Netlify (gratuito)
O projeto já vem com `netlify.toml`. Passos:

1. Suba o projeto para um repositório no GitHub.
2. No Netlify: **Add new site → Import an existing project** → conecte o GitHub e escolha o repositório.
3. **ANTES de fazer o deploy**, vá em **Site configuration → Environment variables** e adicione
   (senão o build falha com "supabaseUrl is required"):
   - `NEXT_PUBLIC_SUPABASE_URL` = a Project URL do Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = a chave anon public do Supabase
   - `NEXT_PUBLIC_SITE_URL` = o endereço do site (ex.: https://seusite.netlify.app)
   - `NEXT_PUBLIC_WHATSAPP` = 55 + DDD + número (ex.: 5531998887499)
   - (opcionais) `NEXT_PUBLIC_INSTAGRAM`, `NEXT_PUBLIC_EMAIL`
4. Clique em **Deploy**. O build leva 2–4 min. Toda alteração no repositório redeploya sozinho.

Importante: variáveis `NEXT_PUBLIC_` entram no site no momento do build. Se mudar alguma,
é preciso **disparar um novo deploy** para valer.

## Domínio próprio
Vercel → Project → Settings → Domains → adicione `bazar.suainstituicao.org.br`
e aponte o DNS conforme as instruções que a Vercel mostrar.

## Backups do banco
Supabase faz backup automático nos planos pagos. No plano free, exporte
periodicamente em **Database → Backups** ou via `pg_dump`.

## Segurança já configurada
- **RLS**: o público só lê produtos não-ocultos; escrever exige login
- **Auth** do Supabase protege o `/admin` (reforçado pelo `middleware.ts`)
- Proteções contra SQL Injection e XSS vêm do Supabase + React por padrão
- `robots.txt` bloqueia indexação do `/admin`

## Evoluções futuras (a arquitetura já está pronta)
A separação entre dados (`supabase/`), acesso a dados (`lib/queries.ts`) e
interface (`components/`) permite crescer sem reescrever:

- **Pagamento (PIX/cartão)**: criar tabela `pedidos` e uma Edge Function que integra
  com um gateway (ex.: Mercado Pago). A página do produto ganha um botão "Comprar".
- **Carrinho / área do comprador**: reusar o Auth do Supabase para clientes e uma
  tabela `carrinho`. A camada de leitura já é isolada.
- **Controle de estoque**: o campo `quantidade` já existe; basta decrementar na venda.
- **Notificações (e-mail/WhatsApp)**: Edge Function disparada por trigger de banco.
- **App mobile**: o mesmo backend Supabase serve um app React Native/Expo.
- **Painel financeiro / recibos / ERP**: novas tabelas + views; o Postgres comporta.
