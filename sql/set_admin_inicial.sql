-- ATENÇÃO: substitua este email pelo email real do usuário administrador no Supabase Auth.
-- Substitua o e-mail abaixo pelo e-mail do administrador logado no Supabase Auth

insert into public.usuarios (
  auth_user_id,
  nome,
  email,
  perfil,
  ativo
)
select
  au.id,
  coalesce(au.raw_user_meta_data->>'name', au.email),
  au.email,
  'admin',
  true
from auth.users au
where au.email = 'admin@teste.com'
on conflict (email) do update set
  auth_user_id = excluded.auth_user_id,
  perfil = 'admin',
  ativo = true;

-- Concede todas as permissões ao admin

insert into public.usuario_modulos (
  usuario_id,
  modulo_id,
  pode_visualizar,
  pode_criar,
  pode_editar,
  pode_excluir
)
select
  u.id,
  m.id,
  true,
  true,
  true,
  true
from public.usuarios u
cross join public.modulos_sistema m
where u.email = 'admin@teste.com'
on conflict (usuario_id, modulo_id) do update set
  pode_visualizar = true,
  pode_criar = true,
  pode_editar = true,
  pode_excluir = true;
