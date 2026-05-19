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
        JSON.stringify({ error: 'Apenas administradores podem criar ou atualizar usuários.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();

    const usuarioId = body.usuario_id || body.usuarioId || null;
    const isEdit = Boolean(usuarioId);

    const nome = String(body.nome || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = body.password ? String(body.password).trim() : '';
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

    if (!isEdit && (!password || password.length < 6)) {
      return new Response(
        JSON.stringify({ error: 'Informe uma senha temporária com pelo menos 6 caracteres.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (isEdit && password && password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'A nova senha deve ter pelo menos 6 caracteres.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let usuarioExistente = null;

    if (usuarioId) {
      const { data, error } = await supabaseAdmin
        .from('usuarios')
        .select('id, auth_user_id, email')
        .eq('id', usuarioId)
        .maybeSingle();

      if (error) throw error;
      usuarioExistente = data;
    }

    if (!usuarioExistente) {
      const { data, error } = await supabaseAdmin
        .from('usuarios')
        .select('id, auth_user_id, email')
        .eq('email', email)
        .maybeSingle();

      if (error) throw error;
      usuarioExistente = data;
    }

    let authUserId: string | null = usuarioExistente?.auth_user_id || null;

    if (authUserId) {
      const updateAuthPayload: Record<string, any> = {
        email,
        email_confirm: true,
        user_metadata: {
          name: nome,
        },
      };

      if (password) {
        updateAuthPayload.password = password;
      }

      const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
        authUserId,
        updateAuthPayload
      );

      if (updateAuthError) {
        throw updateAuthError;
      }
    } else {
      if (password || !isEdit) {
        const { data: createdAuth, error: createAuthError } =
          await supabaseAdmin.auth.admin.createUser({
            email,
            password: password || undefined,
            email_confirm: true,
            user_metadata: {
              name: nome,
            },
          });

        if (createAuthError) {
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

          const updateAuthPayload: Record<string, any> = {
            email_confirm: true,
            user_metadata: {
              name: nome,
            },
          };

          if (password) {
            updateAuthPayload.password = password;
          }

          const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
            authUserId,
            updateAuthPayload
          );

          if (updateAuthError) {
            throw updateAuthError;
          }
        } else {
          authUserId = createdAuth.user?.id || null;
        }
      }
    }

    let usuario = null;

    if (usuarioId) {
      const updatePayload: Record<string, any> = {
        nome,
        email,
        perfil,
        ativo,
      };

      if (authUserId) {
        updatePayload.auth_user_id = authUserId;
      }

      const { data, error } = await supabaseAdmin
        .from('usuarios')
        .update(updatePayload)
        .eq('id', usuarioId)
        .select('*')
        .single();

      if (error) throw error;
      usuario = data;
    } else {
      const upsertPayload: Record<string, any> = {
        nome,
        email,
        perfil,
        ativo,
      };

      if (authUserId) {
        upsertPayload.auth_user_id = authUserId;
      }

      const { data, error } = await supabaseAdmin
        .from('usuarios')
        .upsert(upsertPayload, {
          onConflict: 'email',
        })
        .select('*')
        .single();

      if (error) throw error;
      usuario = data;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        usuario,
        auth_user_id: authUserId,
        senha_atualizada: Boolean(password),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('ERRO ADMIN-CREATE-USER:', error);

    return new Response(
      JSON.stringify({
        error: error?.message || 'Erro ao processar usuário.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
