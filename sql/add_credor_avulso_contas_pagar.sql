alter table public.contas_pagar
add column if not exists credor_avulso text null;

comment on column public.contas_pagar.credor_avulso
is 'Nome textual do credor para contas avulsas, sem vínculo obrigatório com pessoas ou empresas.';
