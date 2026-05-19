import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { usuariosService } from '@/services/usuariosService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const [usuarioSistema, setUsuarioSistema] = useState(null);
  const [permissoes, setPermissoes] = useState([]);
  const [permissoesLoading, setPermissoesLoading] = useState(false);

  const carregarUsuarioSistema = useCallback(async () => {
    try {
      setPermissoesLoading(true);

      await usuariosService.sincronizarUsuarioAtual();

      const usuarioCompleto = await usuariosService.getUsuarioAtual();

      setUsuarioSistema(usuarioCompleto || null);
      setPermissoes(usuarioCompleto?.usuario_modulos || []);

      if (!usuarioCompleto) {
        console.error('USUÁRIO DO SISTEMA NÃO ENCONTRADO PARA O AUTH ATUAL.');
      }

      if (usuarioCompleto && (!usuarioCompleto.usuario_modulos || usuarioCompleto.usuario_modulos.length === 0)) {
        console.error('USUÁRIO DO SISTEMA SEM PERMISSÕES CARREGADAS:', usuarioCompleto.email);
      }
    } catch (error) {
      console.error('ERRO AO CARREGAR USUÁRIO/PERMISSÕES:', error);

      setUsuarioSistema(null);
      setPermissoes([]);
    } finally {
      setPermissoesLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (!mounted) return;

        const currentSession = data?.session || null;

        setSession(currentSession);
        setUser(currentSession?.user || null);
      } catch (error) {
        console.error('ERRO AO INICIAR AUTH:', error);

        if (mounted) {
          setAuthError(error);
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;

      setSession(newSession || null);
      setUser(newSession?.user || null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setUsuarioSistema(null);
      setPermissoes([]);
      setPermissoesLoading(false);
      return;
    }

    carregarUsuarioSistema();
  }, [user?.id, carregarUsuarioSistema]);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const currentSession = data?.session || null;
    const currentUser = data?.user || currentSession?.user || null;

    setSession(currentSession);
    setUser(currentUser);

    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    setSession(null);
    setUser(null);
    setUsuarioSistema(null);
    setPermissoes([]);
  };

  const signIn = login;
  const signOut = logout;

  const isAdmin = usuarioSistema?.perfil === 'admin' && usuarioSistema?.ativo !== false;

  const getPermissaoModulo = (slug) => {
    if (isAdmin) {
      return {
        pode_visualizar: true,
        pode_criar: true,
        pode_editar: true,
        pode_excluir: true,
      };
    }

    const permissao = (permissoes || []).find((p) => {
      const modulo =
        p.modulos_sistema ||
        p.modulo ||
        p.modulos ||
        p.modulo_sistema ||
        null;

      return modulo?.slug === slug;
    });

    return {
      pode_visualizar: Boolean(permissao?.pode_visualizar),
      pode_criar: Boolean(permissao?.pode_criar),
      pode_editar: Boolean(permissao?.pode_editar),
      pode_excluir: Boolean(permissao?.pode_excluir),
    };
  };

  const hasPermission = (slug, action = 'visualizar') => {
    if (!slug) return true;
    if (isAdmin) return true;

    const permissao = getPermissaoModulo(slug);

    const map = {
      visualizar: permissao.pode_visualizar,
      criar: permissao.pode_criar,
      editar: permissao.pode_editar,
      excluir: permissao.pode_excluir,
    };

    return Boolean(map[action]);
  };

  const value = {
    user,
    session,
    loading,
    authError,

    usuarioSistema,
    permissoes,
    permissoesLoading,
    isAdmin,

    login,
    logout,
    signIn,
    signOut,

    getPermissaoModulo,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }

  return context;
};
