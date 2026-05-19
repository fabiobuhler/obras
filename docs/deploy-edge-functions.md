# Deploy da Edge Function admin-create-user

Esta função cria usuários no Supabase Auth de forma segura.

## Pré-requisitos

- Supabase CLI instalado
- Login no Supabase CLI
- Projeto vinculado

## Comandos

```bash
supabase login

supabase link --project-ref hujrhgrfqworawsmngcb

supabase functions deploy admin-create-user
```

## Secrets necessários

A função usa variáveis padrão do Supabase:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Se necessário configurar manualmente:

```bash
supabase secrets set SUPABASE_URL="https://hujrhgrfqworawsmngcb.supabase.co"
supabase secrets set SUPABASE_ANON_KEY="..."
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="..."
```

> [!WARNING]  
> Nunca coloque a `SUPABASE_SERVICE_ROLE_KEY` no frontend ou em arquivos públicos do repositório.

## Teste

Após deploy, acessar o sistema como admin e cadastrar usuário com senha temporária.
