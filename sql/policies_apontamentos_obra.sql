-- Habilitar Row-Level Security (RLS) na tabela apontamentos_obra
alter table public.apontamentos_obra enable row level security;

-- Remover políticas existentes se houver
drop policy if exists "Permitir leitura para usuários autenticados" on public.apontamentos_obra;
drop policy if exists "Permitir inserção para usuários autenticados" on public.apontamentos_obra;
drop policy if exists "Permitir atualização para usuários autenticados" on public.apontamentos_obra;
drop policy if exists "Permitir exclusão para usuários autenticados" on public.apontamentos_obra;

-- 1. Política de Leitura (SELECT)
create policy "Permitir leitura para usuários autenticados"
  on public.apontamentos_obra
  for select
  to authenticated
  using (true);

-- 2. Política de Inserção (INSERT)
create policy "Permitir inserção para usuários autenticados"
  on public.apontamentos_obra
  for insert
  to authenticated
  with check (true);

-- 3. Política de Atualização (UPDATE)
create policy "Permitir atualização para usuários autenticados"
  on public.apontamentos_obra
  for update
  to authenticated
  using (true)
  with check (true);

-- 4. Política de Exclusão (DELETE)
create policy "Permitir exclusão para usuários autenticados"
  on public.apontamentos_obra
  for delete
  to authenticated
  using (true);
