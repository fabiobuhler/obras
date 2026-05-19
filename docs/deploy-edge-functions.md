# Deploy da Edge Function admin-create-user

## Problema comum

Se aparecer:

`unexpected deploy status 401: {"message":"Unauthorized"}`

significa que o token da Supabase CLI não tem permissão no projeto ou está expirado/incorreto.

## Segurança

Se um token `sbp_...` foi colado em chat, commit ou outro local inseguro, revogue imediatamente:

Supabase Dashboard > Account > Access Tokens

Depois gere um novo token.

Nunca salve `SUPABASE_SERVICE_ROLE_KEY` no frontend, GitHub Pages, `.env` público ou workflow de Pages.

## Project ref

hujrhgrfqworawsmngcb

## 1. Login CLI com token novo

No PowerShell:

```powershell
cd C:\Users\Fabio\.antigravity\gestao-obras
.\scripts\supabase\login-supabase-cli.ps1
```

Depois confirme se o projeto aparece:

```powershell
npx supabase@latest projects list
```

O projeto `hujrhgrfqworawsmngcb` precisa aparecer.

## 2. Configurar secrets da função

```powershell
cd C:\Users\Fabio\.antigravity\gestao-obras
.\scripts\supabase\set-function-secrets.ps1
```

Informar:

* SUPABASE_URL
* SUPABASE_ANON_KEY
* SUPABASE_SERVICE_ROLE_KEY

A service role key fica somente no ambiente seguro da Edge Function.

## 3. Deploy

```powershell
cd C:\Users\Fabio\.antigravity\gestao-obras
.\scripts\supabase\deploy-admin-create-user.ps1
```

## 4. Teste manual

Após o deploy:

1. Entrar no sistema como admin.
2. Ir em `/usuarios`.
3. Criar novo usuário com senha temporária.
4. Confirmar que aparece Auth: Vinculado.
5. Definir permissões.
6. Sair.
7. Entrar com o novo usuário.

## 5. Se continuar 401

Verifique:

* o token pertence à conta correta;
* a conta tem acesso ao projeto;
* o projeto aparece em `npx supabase@latest projects list`;
* você revogou tokens antigos expostos;
* está usando `npx supabase@latest`, não versão antiga.
