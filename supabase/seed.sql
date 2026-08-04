-- Dados de exemplo. Rode DEPOIS do schema.sql. Opcional.

insert into public.categorias (nome, slug, icone, ordem) values
  ('Móveis',      'moveis',      '🪑', 1),
  ('Roupas',      'roupas',      '👕', 2),
  ('Livros',      'livros',      '📚', 3),
  ('Decoração',   'decoracao',   '🖼️', 4),
  ('Utensílios',  'utensilios',  '🍽️', 5),
  ('Brinquedos',  'brinquedos',  '🧸', 6),
  ('Eletrônicos', 'eletronicos', '📻', 7)
on conflict (slug) do nothing;

-- produtos de exemplo (código gerado automaticamente pelo default)
insert into public.produtos (nome, descricao, categoria_id, estado, preco, status, destaque, dimensoes)
select v.nome, v.descricao, c.id, v.estado, v.preco, v.status::produto_status, v.destaque, v.dim
from (values
  ('Cadeira de madeira maciça', 'Madeira de lei, estrutura firme. Pequenas marcas de uso.', 'moveis',     'Usado — bom', 45.00, 'disponivel', true,  '45 × 42 × 90 cm'),
  ('Coleção de livros clássicos','Lote com 6 obras, capas conservadas.',                    'livros',     'Seminovo',    30.00, 'disponivel', true,  null),
  ('Jogo de xícaras de porcelana','Seis xícaras com pires, filete dourado.',                'utensilios', 'Usado — bom', 38.00, 'reservado',  true,  null),
  ('Luminária de mesa retrô',   'Metálica articulada, testada. Acompanha lâmpada.',         'decoracao',  'Usado — bom', 55.00, 'disponivel', true,  'Altura 40 cm'),
  ('Estante baixa 3 prateleiras','MDF branco, três prateleiras firmes. Desmontável.',       'moveis',     'Usado — bom', 90.00, 'disponivel', true,  '80 × 30 × 90 cm'),
  ('Kit panelas inox',          'Cinco panelas com tampas de vidro, fundo triplo.',         'utensilios', 'Seminovo',    60.00, 'disponivel', false, null)
) as v(nome, descricao, cat_slug, estado, preco, status, destaque, dim)
join public.categorias c on c.slug = v.cat_slug;

-- Configurações iniciais com os dados oficiais da casa
update public.configuracoes set
  nome_site   = 'Bazar Beneficente',
  instituicao = 'Cenáculo Espírita Thiago Maior',
  descricao   = 'Toda a arrecadação sustenta os projetos sociais do Cenáculo Espírita Thiago Maior.',
  whatsapp    = '5531998887499',
  email       = 'thiagomaior@outlook.com',
  instagram   = 'https://instagram.com/thiagomaiorespirita',
  endereco    = 'Praça Milton Campos, 127 — Serra, Belo Horizonte/MG · CEP 30130-040',
  horarios    = 'Doações nos horários de funcionamento da casa'
where id = 1;

-- Vendas de exemplo (para o relatório já nascer com dados).
-- vendido_em é informado explicitamente para espalhar as datas no gráfico.
insert into public.produtos (nome, descricao, categoria_id, estado, preco, status, valor_final, vendido_em)
select v.nome, v.descricao, c.id, v.estado, v.preco, 'vendido'::produto_status, v.vfinal, (now() - (v.dias || ' days')::interval)
from (values
  ('Mesa de centro de vidro',   'Tampo de vidro temperado, base de madeira.', 'moveis',      'Usado — bom', 70.00, 70.00, 1),
  ('Casaco de lã infantil',     'Tamanho 6 anos, muito conservado.',          'roupas',      'Seminovo',    25.00, 20.00, 2),
  ('Enciclopédia ilustrada',    'Volume único, ótimo para pesquisa.',         'livros',      'Usado — bom', 18.00, 18.00, 2),
  ('Ventilador de mesa',        'Testado e funcionando, 3 velocidades.',      'eletronicos', 'Usado — bom', 40.00, 35.00, 5),
  ('Conjunto de potes',         'Seis potes herméticos, tampas novas.',       'utensilios',  'Novo',        28.00, 28.00, 9),
  ('Quadro decorativo grande',  'Moldura de madeira, pronto para pendurar.',  'decoracao',   'Usado — bom', 50.00, 45.00, 15)
) as v(nome, descricao, cat_slug, estado, preco, vfinal, dias)
join public.categorias c on c.slug = v.cat_slug;

-- distribui formas de pagamento nas vendas de exemplo (variedade para o relatório)
update public.produtos set forma_pagamento = case (abs(hashtext(codigo)) % 4)
  when 0 then 'dinheiro' when 1 then 'pix' when 2 then 'credito' else 'debito' end
where status = 'vendido' and forma_pagamento is null;
