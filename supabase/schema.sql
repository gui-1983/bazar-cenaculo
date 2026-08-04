-- =====================================================================
--  BAZAR BENEFICENTE — Cenáculo Espírita Thiago Maior
--  Schema completo. Cole no Supabase → SQL Editor → Run.
--  Idempotente onde possível; seguro para rodar em projeto novo.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- ENUMS ----------
do $$ begin
  create type produto_status as enum ('disponivel', 'reservado', 'vendido', 'oculto');
exception when duplicate_object then null; end $$;

-- ---------- CATEGORIAS ----------
create table if not exists public.categorias (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  slug        text not null unique,
  icone       text,                       -- emoji ou nome de ícone
  imagem_url  text,
  ordem       int  not null default 0,
  criado_em   timestamptz not null default now()
);

-- ---------- SEQUÊNCIA + GERADOR DE CÓDIGO (BAZ-000001) ----------
create sequence if not exists public.produto_codigo_seq start 1;

create or replace function public.gerar_codigo_produto()
returns text language sql as $$
  select 'BAZ-' || lpad(nextval('public.produto_codigo_seq')::text, 6, '0');
$$;

-- ---------- PRODUTOS ----------
create table if not exists public.produtos (
  id             uuid primary key default gen_random_uuid(),
  codigo         text not null unique default public.gerar_codigo_produto(),
  nome           text not null,
  descricao      text,
  categoria_id   uuid references public.categorias(id) on delete set null,
  estado         text,                    -- "Novo", "Seminovo", "Usado — bom"...
  preco          numeric(10,2) not null default 0,
  quantidade     int not null default 1,
  status         produto_status not null default 'disponivel',
  destaque       boolean not null default false,
  dimensoes      text,
  observacoes    text,
  visualizacoes  int not null default 0,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);

-- imagens (até 10 por produto; ordenáveis; 1 principal)
create table if not exists public.produto_imagens (
  id          uuid primary key default gen_random_uuid(),
  produto_id  uuid not null references public.produtos(id) on delete cascade,
  url         text not null,
  ordem       int  not null default 0,
  principal   boolean not null default false,
  criado_em   timestamptz not null default now()
);

create index if not exists idx_produtos_status     on public.produtos(status);
create index if not exists idx_produtos_categoria  on public.produtos(categoria_id);
create index if not exists idx_produtos_destaque   on public.produtos(destaque);
create index if not exists idx_imagens_produto     on public.produto_imagens(produto_id);

-- busca textual simples (nome + descrição + código)
create index if not exists idx_produtos_busca on public.produtos
  using gin (to_tsvector('portuguese', coalesce(nome,'') || ' ' || coalesce(descricao,'') || ' ' || coalesce(codigo,'')));

-- ---------- TRIGGER atualizado_em ----------
create or replace function public.touch_atualizado_em()
returns trigger language plpgsql as $$
begin new.atualizado_em = now(); return new; end $$;

drop trigger if exists trg_produtos_touch on public.produtos;
create trigger trg_produtos_touch before update on public.produtos
  for each row execute function public.touch_atualizado_em();

-- ---------- RPC: incrementar visualizações (usado na página do produto) ----------
create or replace function public.incrementar_visualizacoes(p_codigo text)
returns void language sql security definer as $$
  update public.produtos set visualizacoes = visualizacoes + 1 where codigo = p_codigo;
$$;

-- =====================================================================
--  ROW LEVEL SECURITY
--  Público: LÊ apenas produtos que não estão "oculto".
--  Escrita: somente usuários autenticados (voluntários/admin).
-- =====================================================================
alter table public.categorias        enable row level security;
alter table public.produtos          enable row level security;
alter table public.produto_imagens   enable row level security;

-- CATEGORIAS
drop policy if exists cat_select_public on public.categorias;
create policy cat_select_public on public.categorias for select using (true);
drop policy if exists cat_write_auth on public.categorias;
create policy cat_write_auth on public.categorias for all
  to authenticated using (true) with check (true);

-- PRODUTOS
drop policy if exists prod_select_public on public.produtos;
create policy prod_select_public on public.produtos for select
  using (status <> 'oculto');
drop policy if exists prod_select_auth on public.produtos;
create policy prod_select_auth on public.produtos for select
  to authenticated using (true);                      -- admin vê tudo, inclusive oculto
drop policy if exists prod_write_auth on public.produtos;
create policy prod_write_auth on public.produtos for all
  to authenticated using (true) with check (true);

-- IMAGENS
drop policy if exists img_select_public on public.produto_imagens;
create policy img_select_public on public.produto_imagens for select using (true);
drop policy if exists img_write_auth on public.produto_imagens;
create policy img_write_auth on public.produto_imagens for all
  to authenticated using (true) with check (true);

-- =====================================================================
--  STORAGE — bucket público "produtos" (leitura livre, escrita autenticada)
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', true)
on conflict (id) do nothing;

drop policy if exists storage_read_public on storage.objects;
create policy storage_read_public on storage.objects for select
  using (bucket_id = 'produtos');

drop policy if exists storage_write_auth on storage.objects;
create policy storage_write_auth on storage.objects for insert
  to authenticated with check (bucket_id = 'produtos');

drop policy if exists storage_update_auth on storage.objects;
create policy storage_update_auth on storage.objects for update
  to authenticated using (bucket_id = 'produtos');

drop policy if exists storage_delete_auth on storage.objects;
create policy storage_delete_auth on storage.objects for delete
  to authenticated using (bucket_id = 'produtos');

-- =====================================================================
--  VIEW de conveniência: produto + categoria + imagem principal
-- =====================================================================
drop view if exists public.vw_produtos;
create view public.vw_produtos as
select
  p.*,
  c.nome as categoria_nome,
  c.slug as categoria_slug,
  c.icone as categoria_icone,
  (select url from public.produto_imagens i
     where i.produto_id = p.id order by i.principal desc, i.ordem asc limit 1) as imagem_principal
from public.produtos p
left join public.categorias c on c.id = p.categoria_id;

-- =====================================================================
--  CONFIGURAÇÕES DO SITE (editáveis pelo painel — só administradores)
--  Linha única (id = 1). Leitura pública; escrita exige login.
-- =====================================================================
create table if not exists public.configuracoes (
  id            int primary key default 1,
  nome_site     text,
  instituicao   text,
  descricao     text,
  whatsapp      text,
  email         text,
  instagram     text,
  endereco      text,
  horarios      text,
  hero_url      text,
  atualizado_em timestamptz not null default now(),
  constraint configuracoes_singleton check (id = 1)
);

-- garante a existência da linha única
insert into public.configuracoes (id) values (1)
  on conflict (id) do nothing;

alter table public.configuracoes enable row level security;

drop policy if exists "config leitura publica" on public.configuracoes;
create policy "config leitura publica"
  on public.configuracoes for select using (true);

drop policy if exists "config escrita autenticada" on public.configuracoes;
create policy "config escrita autenticada"
  on public.configuracoes for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- atualiza atualizado_em automaticamente (reusa a função touch do schema)
drop trigger if exists trg_config_touch on public.configuracoes;
create trigger trg_config_touch before update on public.configuracoes
  for each row execute function public.touch_atualizado_em();

-- =====================================================================
--  REGISTRO DE VENDAS (para o relatório de arrecadação)
--  Ao marcar um produto como "vendido", carimba data e valor da venda.
--  Assim o relatório soma por dia/mês sem trabalho extra do voluntário.
-- =====================================================================
alter table public.produtos add column if not exists vendido_em  timestamptz;
alter table public.produtos add column if not exists valor_final numeric(10,2);

create or replace function public.stamp_venda()
returns trigger language plpgsql as $$
begin
  if new.status = 'vendido' then
    if new.vendido_em is null then new.vendido_em := now(); end if;
    if new.valor_final is null then new.valor_final := new.preco; end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_stamp_venda on public.produtos;
create trigger trg_stamp_venda before insert or update on public.produtos
  for each row execute function public.stamp_venda();

create index if not exists idx_produtos_vendido_em on public.produtos (vendido_em);

-- recria a view para incluir as colunas de venda recém-adicionadas
drop view if exists public.vw_produtos;
create view public.vw_produtos as
select
  p.*,
  c.nome  as categoria_nome,
  c.slug  as categoria_slug,
  c.icone as categoria_icone,
  (select url from public.produto_imagens i
     where i.produto_id = p.id order by i.principal desc, i.ordem asc limit 1) as imagem_principal
from public.produtos p
left join public.categorias c on c.id = p.categoria_id;

-- =====================================================================
--  FORMA DE PAGAMENTO da venda (para conferência do caixa)
-- =====================================================================
alter table public.produtos add column if not exists forma_pagamento text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'produtos_forma_pagamento_chk') then
    alter table public.produtos add constraint produtos_forma_pagamento_chk
      check (forma_pagamento is null or forma_pagamento in ('dinheiro','pix','credito','debito'));
  end if;
end $$;

-- recria a view para expor a forma de pagamento
drop view if exists public.vw_produtos;
create view public.vw_produtos as
select
  p.*,
  c.nome  as categoria_nome,
  c.slug  as categoria_slug,
  c.icone as categoria_icone,
  (select url from public.produto_imagens i
     where i.produto_id = p.id order by i.principal desc, i.ordem asc limit 1) as imagem_principal
from public.produtos p
left join public.categorias c on c.id = p.categoria_id;

-- =====================================================================
--  RESERVAS  (cliente com prazo de 48h · voluntário sem prazo c/ revisão)
-- =====================================================================
alter table public.produtos add column if not exists reserva_origem      text;         -- 'cliente' | 'voluntario'
alter table public.produtos add column if not exists reservado_em         timestamptz;
alter table public.produtos add column if not exists reserva_expira_em    timestamptz;  -- só cliente (48h)
alter table public.produtos add column if not exists reserva_revisado_em  timestamptz;  -- voluntário: última confirmação
alter table public.produtos add column if not exists reserva_obs          text;         -- nome/contato de quem reservou

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'produtos_reserva_origem_chk') then
    alter table public.produtos add constraint produtos_reserva_origem_chk
      check (reserva_origem is null or reserva_origem in ('cliente','voluntario'));
  end if;
end $$;

-- Cliente reserva pelo site: transição controlada (disponível -> reservado, 48h).
-- SECURITY DEFINER: roda com privilégios do dono, mas só faz esta ação específica.
create or replace function public.reservar_cliente(p_codigo text)
returns text language plpgsql security definer as $$
declare v_status public.produto_status;
begin
  -- se este item tinha reserva de cliente vencida, libera antes de checar
  update public.produtos set
    status='disponivel', reserva_origem=null, reservado_em=null,
    reserva_expira_em=null, reserva_revisado_em=null, reserva_obs=null
  where codigo = p_codigo and status='reservado' and reserva_origem='cliente'
    and reserva_expira_em is not null and reserva_expira_em < now();

  select status into v_status from public.produtos where codigo = p_codigo;
  if v_status is null then return 'nao_encontrado'; end if;
  if v_status <> 'disponivel' then return 'indisponivel'; end if;
  update public.produtos set
    status='reservado', reserva_origem='cliente',
    reservado_em=now(), reserva_expira_em=now()+interval '48 hours',
    reserva_revisado_em=null
  where codigo = p_codigo;
  return 'ok';
end $$;
grant execute on function public.reservar_cliente(text) to anon, authenticated;

-- Libera reservas de cliente vencidas (volta para disponível).
create or replace function public.expirar_reservas()
returns integer language plpgsql security definer as $$
declare n integer;
begin
  update public.produtos set
    status='disponivel', reserva_origem=null, reservado_em=null,
    reserva_expira_em=null, reserva_revisado_em=null, reserva_obs=null
  where status='reservado' and reserva_origem='cliente'
    and reserva_expira_em is not null and reserva_expira_em < now();
  get diagnostics n = row_count;
  return n;
end $$;
grant execute on function public.expirar_reservas() to anon, authenticated;

-- (Opcional) Agendamento automático a cada 15 min, se a extensão pg_cron existir.
do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('expirar-reservas', '*/15 * * * *', $q$ select public.expirar_reservas(); $q$);
  end if;
exception when others then null; end $$;

-- recria a view com os campos de reserva
drop view if exists public.vw_produtos;
create view public.vw_produtos as
select
  p.*,
  c.nome  as categoria_nome,
  c.slug  as categoria_slug,
  c.icone as categoria_icone,
  (select url from public.produto_imagens i
     where i.produto_id = p.id order by i.principal desc, i.ordem asc limit 1) as imagem_principal
from public.produtos p
left join public.categorias c on c.id = p.categoria_id;

-- A view respeita o RLS das tabelas (PG15+). Sem isso, ela rodaria como "definer"
-- e poderia expor itens ocultos ao público. Com security_invoker, aplica o RLS.
alter view public.vw_produtos set (security_invoker = true);
