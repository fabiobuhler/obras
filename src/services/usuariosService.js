import { supabase } from './supabase';

const normalizePermissao = (item) => ({
  id: item.id,
  usuario_id: item.usuario_id,
  modulo_id: item.modulo_id,
  pode_visualizar: Boolean(item.pode_visualizar),
  pode_criar: Boolean(item.pode_criar),
  pode_editar: Boolean(item.pode_editar),
  pode_excluir: Boolean(item.pode_excluir),
  modulo: item.modulos_sistema || item.modulo || null,
});

export const usuariosService = {
  async getUsuarioAtual() {
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) throw authError;

    const authUser = authData?.user;

    if (!authUser) return null;

    let usuario = null;

    const { data: porAuth, error: porAuthError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (porAuthError) throw porAuthError;

    usuario = porAuth;

    if (!usuario) {
      const { data: porEmail, error: porEmailError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', authUser.email)
        .maybeSingle();

      if (porEmailError) throw porEmailError;

      usuario = porEmail;
    }

    if (!usuario) return null;

    const { data: permissoes, error: permissoesError } = await supabase
      .from('usuario_modulos')
      .select(`
        id,
        usuario_id,
        modulo_id,
        pode_visualizar,
        pode_criar,
        pode_editar,
        pode_excluir,
        modulos_sistema:modulo_id (
          id,
          slug,
          nome,
          rota,
          grupo,
          ordem,
          ativo,
          em_teste
        )
      `)
      .eq('usuario_id', usuario.id);

    if (permissoesError) throw permissoesError;

    return {
      ...usuario,
      usuario_modulos: permissoes || [],
    };
  },

  async sincronizarUsuarioAtual() {
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) throw authError;

    const authUser = authData?.user;
    if (!authUser) return null;

    const { data: porAuth, error: porAuthError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (porAuthError) throw porAuthError;
    if (porAuth) return porAuth;

    const { data: porEmail, error: porEmailError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', authUser.email)
      .maybeSingle();

    if (porEmailError) throw porEmailError;

    if (porEmail) {
      if (!porEmail.auth_user_id) {
        const { data, error } = await supabase
          .from('usuarios')
          .update({ auth_user_id: authUser.id })
          .eq('id', porEmail.id)
          .select('*')
          .single();

        if (error) {
          throw new Error(
            'Usuário encontrado por e-mail, mas não foi possível vincular auth_user_id. Verifique as policies RLS ou execute o set_admin_inicial.sql com o e-mail correto.'
          );
        }

        return data;
      }

      return porEmail;
    }

    const { count, error: countError } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    const perfil = count === 0 ? 'admin' : 'usuario';

    const { data, error } = await supabase
      .from('usuarios')
      .insert({
        auth_user_id: authUser.id,
        nome: authUser.user_metadata?.name || authUser.email,
        email: authUser.email,
        perfil,
        ativo: true,
      })
      .select('*')
      .single();

    if (error) throw error;

    return data;
  },

  async getUsuarios() {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('nome', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getModulos() {
    const { data, error } = await supabase
      .from('modulos_sistema')
      .select('*')
      .eq('ativo', true)
      .order('ordem', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getUsuarioComPermissoes(usuarioId) {
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', usuarioId)
      .single();

    if (usuarioError) throw usuarioError;

    const { data: modulos, error: modulosError } = await supabase
      .from('modulos_sistema')
      .select('*')
      .eq('ativo', true)
      .order('ordem', { ascending: true });

    if (modulosError) throw modulosError;

    const { data: permissoes, error: permissoesError } = await supabase
      .from('usuario_modulos')
      .select('*')
      .eq('usuario_id', usuarioId);

    if (permissoesError) throw permissoesError;

    const permissoesMap = new Map(
      (permissoes || []).map((p) => [p.modulo_id, p])
    );

    return {
      usuario,
      permissoes: (modulos || []).map((modulo) => {
        const permissao = permissoesMap.get(modulo.id);

        return {
          modulo,
          modulo_id: modulo.id,
          pode_visualizar: Boolean(permissao?.pode_visualizar),
          pode_criar: Boolean(permissao?.pode_criar),
          pode_editar: Boolean(permissao?.pode_editar),
          pode_excluir: Boolean(permissao?.pode_excluir),
        };
      }),
    };
  },

  async createUsuario(payload) {
    const dados = {
      nome: payload.nome,
      email: payload.email,
      perfil: payload.perfil || 'usuario',
      ativo: payload.ativo ?? true,
      auth_user_id: payload.auth_user_id || null,
    };

    const { data, error } = await supabase
      .from('usuarios')
      .insert(dados)
      .select('*')
      .single();

    if (error) throw error;

    return data;
  },

  async updateUsuario(id, payload) {
    const dados = {
      nome: payload.nome,
      email: payload.email,
      perfil: payload.perfil,
      ativo: payload.ativo,
      auth_user_id: payload.auth_user_id || null,
    };

    const { data, error } = await supabase
      .from('usuarios')
      .update(dados)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    return data;
  },

  async updatePermissoes(usuarioId, permissoes) {
    if (!usuarioId) throw new Error('Usuário não informado.');

    const registros = permissoes.map((p) => ({
      usuario_id: usuarioId,
      modulo_id: p.modulo_id,
      pode_visualizar: Boolean(p.pode_visualizar),
      pode_criar: Boolean(p.pode_criar),
      pode_editar: Boolean(p.pode_editar),
      pode_excluir: Boolean(p.pode_excluir),
    }));

    const { error } = await supabase
      .from('usuario_modulos')
      .upsert(registros, {
        onConflict: 'usuario_id,modulo_id',
      });

    if (error) throw error;

    return true;
  },

  async desativarUsuario(id) {
    const { data, error } = await supabase
      .from('usuarios')
      .update({ ativo: false })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    return data;
  },

  async createUsuarioComAuth(payload) {
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: {
        nome: payload.nome,
        email: payload.email,
        password: payload.password,
        perfil: payload.perfil || 'usuario',
        ativo: payload.ativo ?? true,
      },
    });

    if (error) {
      throw new Error(error.message || 'Erro ao chamar função de criação de usuário.');
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return data?.usuario || data;
  },
};
