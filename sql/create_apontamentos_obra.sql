create table if not exists public.apontamentos_obra (
  id uuid primary key default gen_random_uuid(),

  obra_id uuid not null references public.obras(id) on delete cascade,

  tipo text not null check (tipo in ('mao_obra', 'equipamento')),

  funcionario_id uuid null references public.funcionarios(id) on delete set null,
  equipamento_id uuid null references public.equipamentos(id) on delete set null,

  data date not null,

  quantidade_horas numeric(10,2) not null default 0,

  tipo_hora text null,
  multiplicador numeric(10,2) not null default 1,

  valor_unitario numeric(14,2) not null default 0,
  custo_total numeric(14,2) not null default 0,

  descricao text null,
  observacao text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint apontamentos_obra_tipo_recurso_chk check (
    (tipo = 'mao_obra' and funcionario_id is not null and equipamento_id is null)
    or
    (tipo = 'equipamento' and equipamento_id is not null and funcionario_id is null)
  )
);

create index if not exists idx_apontamentos_obra_obra_id
  on public.apontamentos_obra(obra_id);

create index if not exists idx_apontamentos_obra_data
  on public.apontamentos_obra(data);

create index if not exists idx_apontamentos_obra_tipo
  on public.apontamentos_obra(tipo);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_apontamentos_obra_updated_at on public.apontamentos_obra;

create trigger trg_apontamentos_obra_updated_at
before update on public.apontamentos_obra
for each row
execute function public.set_updated_at();
