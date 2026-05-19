-- Executar se desejar voltar a usar o campo observação no futuro
-- Esse SQL adiciona de forma segura a coluna observacao na tabela public.usuarios

alter table public.usuarios
add column if not exists observacao text null;
