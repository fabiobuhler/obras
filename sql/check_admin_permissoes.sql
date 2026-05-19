-- Substitua admin@teste.com pelo e-mail real do administrador, se for diferente.

select
  u.id,
  u.auth_user_id,
  u.nome,
  u.email,
  u.perfil,
  u.ativo,
  count(um.id) as total_permissoes
from public.usuarios u
left join public.usuario_modulos um on um.usuario_id = u.id
group by
  u.id,
  u.auth_user_id,
  u.nome,
  u.email,
  u.perfil,
  u.ativo
order by u.email;

select
  m.slug,
  m.nome,
  um.pode_visualizar,
  um.pode_criar,
  um.pode_editar,
  um.pode_excluir
from public.usuarios u
join public.usuario_modulos um on um.usuario_id = u.id
join public.modulos_sistema m on m.id = um.modulo_id
where u.email = 'admin@teste.com'
order by m.ordem;
