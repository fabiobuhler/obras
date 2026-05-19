# Edge Function admin-create-user

Esta função cria usuários no Supabase Auth a partir do cadastro interno do sistema.

## Função

- Recebe nome, e-mail, senha temporária, perfil e status.
- Verifica se o usuário que chamou é admin.
- Cria ou atualiza o usuário no Supabase Auth.
- Cria ou atualiza o registro em public.usuarios.
- Retorna auth_user_id.

## Segurança

A chave SUPABASE_SERVICE_ROLE_KEY deve ficar somente no ambiente seguro da Edge Function.
Nunca colocar essa chave no frontend, GitHub Pages, .env público ou workflow do Pages.

## Deploy

Usar os scripts em scripts/supabase/.
