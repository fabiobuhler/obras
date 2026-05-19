import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function ProtectedModuleRoute({ modulo, action = 'visualizar', children }) {
  const { loading, permissoesLoading, user, hasPermission, isAdmin, usuarioSistema } = useAuth();

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground flex h-full items-center justify-center">
        Carregando...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isAdmin) {
    return children;
  }

  if (permissoesLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground flex h-full items-center justify-center">
        Carregando permissões...
      </div>
    );
  }

  if (!usuarioSistema) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-border bg-card p-6 text-card-foreground">
          <h1 className="text-xl font-semibold">Permissões não carregadas</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Seu usuário autenticado não foi vinculado ao cadastro interno. Verifique o set_admin_inicial.sql ou as policies de usuários.
          </p>
        </div>
      </div>
    );
  }

  if (!hasPermission || typeof hasPermission !== 'function') {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-border bg-card p-6 text-card-foreground">
          <h1 className="text-xl font-semibold text-red-600 dark:text-red-400">Permissões indisponíveis</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Não foi possível carregar as permissões do usuário.
          </p>
        </div>
      </div>
    );
  }

  if (!hasPermission(modulo, action)) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-border bg-card p-6 text-card-foreground">
          <h1 className="text-xl font-semibold text-red-600 dark:text-red-400">Acesso Negado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Você não possui permissão para acessar este módulo.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
