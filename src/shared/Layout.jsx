import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LayoutDashboard, Users, Building2, HardHat, LogOut, Menu, X, Moon, Sun, Briefcase, Shield, Wrench, DollarSign, BarChart3, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Layout() {
  const { user, logout, hasPermission, isAdmin, permissoesLoading, usuarioSistema } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fechar sidebar ao redimensionar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, modulo: null },
    { name: 'Obras', path: '/obras', icon: Building2, modulo: 'obras' },
    { name: 'Apontamentos', path: '/obras/apontamentos', icon: Clock, modulo: 'apontamentos_obra' },
    { name: 'Pessoas', path: '/pessoas', icon: Users, modulo: 'pessoas' },
    { name: 'Funcionários', path: '/funcionarios', icon: Briefcase, modulo: 'funcionarios' },
    { name: 'EPIs', path: '/epis', icon: Shield, modulo: 'epis' },
    { name: 'Empresas', path: '/empresas', icon: HardHat, modulo: 'empresas' },
    { name: 'Equipamentos', path: '/equipamentos', icon: Wrench, modulo: 'equipamentos' },
    { name: 'Financeiro', path: '/financeiro', icon: DollarSign, modulo: 'financeiro_contas_pagar' },
    { name: 'Custos por Obra', path: '/financeiro/custos-por-obra', icon: BarChart3, modulo: 'financeiro_custos_obra' },
    { name: 'Usuários', path: '/usuarios', icon: Users, modulo: 'usuarios' },
  ];

  const visibleNavItems = navItems.filter((item) => {
    if (!item.modulo) return true;
    if (isAdmin) return true;
    if (typeof hasPermission !== 'function') return false;
    return hasPermission(item.modulo, 'visualizar');
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex relative overflow-hidden">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-card border-r border-border transition-all duration-300 flex flex-col shrink-0",
          "fixed inset-y-0 left-0 z-50 w-72 transform lg:static lg:translate-x-0 lg:w-64 lg:flex",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <span className="font-bold text-lg text-primary truncate">Gestão Obras</span>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-muted rounded-md transition-colors lg:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 py-4 flex flex-col gap-2 px-3 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname === item.path || (item.path === '/financeiro' && location.pathname.startsWith('/financeiro') && !location.pathname.startsWith('/financeiro/custos-por-obra'));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    setSidebarOpen(false);
                  }
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border flex flex-col gap-2">
          {user && !usuarioSistema && !permissoesLoading && (
            <p className="px-3 py-2 text-xs text-amber-600 dark:text-amber-300 leading-tight">
              Permissões não carregadas. Verifique o vínculo do usuário.
            </p>
          )}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-muted-foreground transition-colors"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            <span>Tema {theme === 'light' ? 'Escuro' : 'Claro'}</span>
          </button>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 border-b border-border bg-card flex items-center px-4 sm:px-6 justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-muted rounded-md transition-colors lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg sm:text-xl font-semibold capitalize">
              {navItems.find(item => {
                if (item.path === '/') return location.pathname === '/';
                return location.pathname === item.path || (item.path === '/financeiro' && location.pathname.startsWith('/financeiro') && !location.pathname.startsWith('/financeiro/custos-por-obra'));
              })?.name || 'Sistema'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl min-w-0">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
