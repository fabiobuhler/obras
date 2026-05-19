create table if not exists public.usuarios (
  id uuid primary key default gen_random_uuid(),

  auth_user_id uuid null unique,
  pessoa_id uuid null references public.pessoas(id) on delete set null,

  nome text not null,
  email text not null unique,

  perfil text not null default 'usuario'
    check (perfil in ('admin', 'gestor', 'usuario', 'consulta')),

  ativo boolean not null default true,

  observacao text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.modulos_sistema (
  id uuid primary key default gen_random_uuid(),

  slug text not null unique,
  nome text not null,
  descricao text null,

  rota text null,
  grupo text null,
  ordem integer not null default 0,

  ativo boolean not null default true,
  em_teste boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.usuario_modulos (
  id uuid primary key default gen_random_uuid(),

  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  modulo_id uuid not null references public.modulos_sistema(id) on delete cascade,

  pode_visualizar boolean not null default false,
  pode_criar boolean not null default false,
  pode_editar boolean not null default false,
  pode_excluir boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (usuario_id, modulo_id)
);

create index if not exists idx_usuarios_auth_user_id
  on public.usuarios(auth_user_id);

create index if not exists idx_usuarios_email
  on public.usuarios(email);

create index if not exists idx_usuario_modulos_usuario_id
  on public.usuario_modulos(usuario_id);

create index if not exists idx_usuario_modulos_modulo_id
  on public.usuario_modulos(modulo_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_usuarios_updated_at on public.usuarios;
create trigger trg_usuarios_updated_at
before update on public.usuarios
for each row
execute function public.set_updated_at();

drop trigger if exists trg_modulos_sistema_updated_at on public.modulos_sistema;
create trigger trg_modulos_sistema_updated_at
before update on public.modulos_sistema
for each row
execute function public.set_updated_at();

drop trigger if exists trg_usuario_modulos_updated_at on public.usuario_modulos;
create trigger trg_usuario_modulos_updated_at
before update on public.usuario_modulos
for each row
execute function public.set_updated_at();

-- Inserir módulos padrão
insert into public.modulos_sistema
  (slug, nome, descricao, rota, grupo, ordem, ativo, em_teste)
values
  ('dashboard', 'Dashboard', 'Painel principal do sistema', '/', 'Geral', 1, true, false),
  ('obras', 'Obras', 'Cadastro e gestão de obras', '/obras', 'Obras', 10, true, false),
  ('apontamentos_obra', 'Apontamentos por Obra', 'Registro de mão de obra e equipamentos por obra', '/obras/apontamentos', 'Obras', 11, true, true),
  ('pessoas', 'Pessoas', 'Cadastro de pessoas', '/pessoas', 'Cadastros', 20, true, false),
  ('funcionarios', 'Funcionários', 'Cadastro e gestão de funcionários', '/funcionarios', 'Cadastros', 21, true, false),
  ('epis', 'EPIs', 'Controle de EPIs', '/epis', 'Cadastros', 22, true, false),
  ('empresas', 'Empresas', 'Cadastro de empresas e fornecedores', '/empresas', 'Cadastros', 23, true, false),
  ('equipamentos', 'Equipamentos', 'Cadastro e gestão de equipamentos', '/equipamentos', 'Cadastros', 24, true, false),
  ('financeiro_contas_pagar', 'Contas a Pagar', 'Controle financeiro de contas a pagar', '/financeiro/contas-pagar', 'Financeiro', 30, true, true),
  ('financeiro_custos_obra', 'Custos por Obra', 'Análise de custos vinculados por obra', '/financeiro/custos-por-obra', 'Financeiro', 31, true, true),
  ('usuarios', 'Usuários e Permissões', 'Cadastro de usuários e permissões do sistema', '/usuarios', 'Administração', 90, true, false)
on conflict (slug) do update set
  nome = excluded.nome,
  descricao = excluded.descricao,
  rota = excluded.rota,
  grupo = excluded.grupo,
  ordem = excluded.ordem,
  ativo = excluded.ativo,
  em_teste = excluded.em_teste;
