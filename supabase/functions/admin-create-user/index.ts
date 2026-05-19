import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método não permitido.' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Variáveis de ambiente da função não configuradas.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cliente com JWT do usuário chamador, respeitando RLS.
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Cliente admin, usado apenas dentro da Edge Function.
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const {
      data: { user: caller },
      error: callerError,
    } = await supabaseUser.auth.getUser();

    if (callerError || !caller) {
      return new Response(
        JSON.stringify({ error: 'Não foi possível validar o usuário autenticado.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: callerAppUser, error: callerAppError } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, perfil, ativo')
      .eq('auth_user_id', caller.id)
      .maybeSingle();

    if (callerAppError) {
      throw callerAppError;
    }

    if (!callerAppUser || callerAppUser.perfil !== 'admin' || callerAppUser.ativo === false) {
      return new Response(
        JSON.stringify({ error: 'Apenas administradores podem criar usuários.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();

    const nome = String(body.nome || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '').trim();
    const perfil = body.perfil || 'usuario';
    const ativo = body.ativo ?? true;

    if (!nome) {
      return new Response(
        JSON.stringify({ error: 'Nome é obrigatório.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'E-mail é obrigatório.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!password || password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Informe uma senha temporária com pelo menos 6 caracteres.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let authUserId: string | null = null;

    // Tenta localizar usuário interno existente por e-mail.
    const { data: usuarioExistente, error: usuarioExistenteError } = await supabaseAdmin
      .from('usuarios')
      .select('id, auth_user_id, email')
      .eq('email', email)
      .maybeSingle();

    if (usuarioExistenteError) {
      throw usuarioExistenteError;
    }

    if (usuarioExistente?.auth_user_id) {
      authUserId = usuarioExistente.auth_user_id;

      const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
        authUserId,
        {
          email,
          password,
          email_confirm: true,
          user_metadata: {
            name: nome,
          },
        }
      );

      if (updateAuthError) {
        throw updateAuthError;
      }
    } else {
      const { data: createdAuth, error: createAuthError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            name: nome,
          },
        });

      if (createAuthError) {
        // Caso o Auth já exista mas não esteja vinculado, tentar localizar pela listagem.
        if (!String(createAuthError.message || '').toLowerCase().includes('already')) {
          throw createAuthError;
        }

        const { data: listData, error: listError } =
          await supabaseAdmin.auth.admin.listUsers();

        if (listError) {
          throw listError;
        }

        const found = listData.users.find((u) => u.email?.toLowerCase() === email);

        if (!found) {
          throw createAuthError;
        }

        authUserId = found.id;

        const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
          authUserId,
          {
            password,
            email_confirm: true,
            user_metadata: {
              name: nome,
            },
          }
        );

        if (updateAuthError) {
          throw updateAuthError;
        }
      } else {
        authUserId = createdAuth.user?.id || null;
      }
    }

    if (!authUserId) {
      return new Response(
        JSON.stringify({ error: 'Não foi possível obter o ID do usuário Auth.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const upsertPayload = {
      auth_user_id: authUserId,
      nome,
      email,
      perfil,
      ativo,
    };

    const { data: usuario, error: upsertUsuarioError } = await supabaseAdmin
      .from('usuarios')
      .upsert(upsertPayload, {
        onConflict: 'email',
      })
      .select('*')
      .single();

    if (upsertUsuarioError) {
      throw upsertUsuarioError;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        usuario,
        auth_user_id: authUserId,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('ERRO ADMIN-CREATE-USER:', error);

    return new Response(
      JSON.stringify({
        error: error?.message || 'Erro ao criar usuário.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
