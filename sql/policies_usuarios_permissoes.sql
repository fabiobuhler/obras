alter table public.usuarios enable row level security;
alter table public.modulos_sistema enable row level security;
alter table public.usuario_modulos enable row level security;

-- Leitura de módulos para usuários autenticados
drop policy if exists "modulos_select_authenticated" on public.modulos_sistema;
create policy "modulos_select_authenticated"
on public.modulos_sistema
for select
to authenticated
using (true);

-- Usuário autenticado pode ler seu próprio registro
drop policy if exists "usuarios_select_self" on public.usuarios;
create policy "usuarios_select_self"
on public.usuarios
for select
to authenticated
using (auth_user_id = auth.uid());

-- Admin pode ler todos os usuários
drop policy if exists "usuarios_select_admin" on public.usuarios;
create policy "usuarios_select_admin"
on public.usuarios
for select
to authenticated
using (
  exists (
    select 1
    from public.usuarios u
    where u.auth_user_id = auth.uid()
      and u.perfil = 'admin'
      and u.ativo = true
  )
);

-- Admin pode inserir usuários
drop policy if exists "usuarios_insert_admin" on public.usuarios;
create policy "usuarios_insert_admin"
on public.usuarios
for insert
to authenticated
with check (
  exists (
    select 1
    from public.usuarios u
    where u.auth_user_id = auth.uid()
      and u.perfil = 'admin'
      and u.ativo = true
  )
);

-- Admin pode atualizar usuários
drop policy if exists "usuarios_update_admin" on public.usuarios;
create policy "usuarios_update_admin"
on public.usuarios
for update
to authenticated
using (
  exists (
    select 1
    from public.usuarios u
    where u.auth_user_id = auth.uid()
      and u.perfil = 'admin'
      and u.ativo = true
  )
)
with check (
  exists (
    select 1
    from public.usuarios u
    where u.auth_user_id = auth.uid()
      and u.perfil = 'admin'
      and u.ativo = true
  )
);

-- Admin pode excluir usuários do cadastro interno, sem apagar auth.users
drop policy if exists "usuarios_delete_admin" on public.usuarios;
create policy "usuarios_delete_admin"
on public.usuarios
for delete
to authenticated
using (
  exists (
    select 1
    from public.usuarios u
    where u.auth_user_id = auth.uid()
      and u.perfil = 'admin'
      and u.ativo = true
  )
);

-- Usuário pode ler suas permissões
drop policy if exists "usuario_modulos_select_self" on public.usuario_modulos;
create policy "usuario_modulos_select_self"
on public.usuario_modulos
for select
to authenticated
using (
  usuario_id in (
    select id from public.usuarios
    where auth_user_id = auth.uid()
  )
);

-- Admin pode ler todas as permissões
drop policy if exists "usuario_modulos_select_admin" on public.usuario_modulos;
create policy "usuario_modulos_select_admin"
on public.usuario_modulos
for select
to authenticated
using (
  exists (
    select 1
    from public.usuarios u
    where u.auth_user_id = auth.uid()
      and u.perfil = 'admin'
      and u.ativo = true
  )
);

-- Admin pode inserir permissões
drop policy if exists "usuario_modulos_insert_admin" on public.usuario_modulos;
create policy "usuario_modulos_insert_admin"
on public.usuario_modulos
for insert
to authenticated
with check (
  exists (
    select 1
    from public.usuarios u
    where u.auth_user_id = auth.uid()
      and u.perfil = 'admin'
      and u.ativo = true
  )
);

-- Admin pode atualizar permissões
drop policy if exists "usuario_modulos_update_admin" on public.usuario_modulos;
create policy "usuario_modulos_update_admin"
on public.usuario_modulos
for update
to authenticated
using (
  exists (
    select 1
    from public.usuarios u
    where u.auth_user_id = auth.uid()
      and u.perfil = 'admin'
      and u.ativo = true
  )
)
with check (
  exists (
    select 1
    from public.usuarios u
    where u.auth_user_id = auth.uid()
      and u.perfil = 'admin'
      and u.ativo = true
  )
);

-- Admin pode excluir permissões
drop policy if exists "usuario_modulos_delete_admin" on public.usuario_modulos;
create policy "usuario_modulos_delete_admin"
on public.usuario_modulos
for delete
to authenticated
using (
  exists (
    select 1
    from public.usuarios u
    where u.auth_user_id = auth.uid()
      and u.perfil = 'admin'
      and u.ativo = true
  )
);

-- Permite ao usuário autenticado vincular seu próprio auth_user_id por e-mail caso esteja nulo
drop policy if exists "usuarios_update_self_link_auth" on public.usuarios;
create policy "usuarios_update_self_link_auth"
on public.usuarios
for update
to authenticated
using (
  email = auth.jwt()->>'email'
  and auth_user_id is null
)
with check (
  email = auth.jwt()->>'email'
  and auth_user_id = auth.uid()
);
