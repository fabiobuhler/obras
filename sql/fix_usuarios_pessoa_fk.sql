-- Executar se desejar voltar a usar o vínculo com pessoas
-- Esse SQL cria a constraint de foreign key entre public.usuarios e public.pessoas de forma segura

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'usuarios'
      and column_name = 'pessoa_id'
  ) then
    if not exists (
      select 1
      from information_schema.table_constraints
      where constraint_schema = 'public'
        and table_name = 'usuarios'
        and constraint_name = 'usuarios_pessoa_id_fkey'
    ) then
      alter table public.usuarios
      add constraint usuarios_pessoa_id_fkey
      foreign key (pessoa_id)
      references public.pessoas(id)
      on delete set null;
    end if;
  end if;
end $$;
