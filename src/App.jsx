import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import Layout from '@/shared/Layout';
import Dashboard from '@/modules/Dashboard/Dashboard';
import Login from '@/modules/Auth/Login';
import PessoasList from '@/modules/Pessoas/PessoasList';
import ObrasList from '@/modules/Obras/ObrasList';
import EmpresasList from '@/modules/Empresas/EmpresasList';

import FuncionariosList from '@/modules/Funcionarios/FuncionariosList';
import EpisList from '@/modules/Epis/EpisList';
import EquipamentosList from '@/modules/Equipamentos/EquipamentosList';
import ContasPagarList from '@/modules/Financeiro/ContasPagarList';
import CustosPorObra from '@/modules/Financeiro/CustosPorObra';
import ApontamentosPorObra from '@/modules/Obras/ApontamentosPorObra';
import UsuariosList from '@/modules/Usuarios/UsuariosList';
import ProtectedModuleRoute from '@/components/auth/ProtectedModuleRoute';

// Protected Route Component
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">Carregando...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="obras" element={<ProtectedModuleRoute modulo="obras"><ObrasList /></ProtectedModuleRoute>} />
        <Route path="obras/apontamentos" element={<ProtectedModuleRoute modulo="apontamentos_obra"><ApontamentosPorObra /></ProtectedModuleRoute>} />
        <Route path="pessoas" element={<ProtectedModuleRoute modulo="pessoas"><PessoasList /></ProtectedModuleRoute>} />
        <Route path="empresas" element={<ProtectedModuleRoute modulo="empresas"><EmpresasList /></ProtectedModuleRoute>} />
        <Route path="funcionarios" element={<ProtectedModuleRoute modulo="funcionarios"><FuncionariosList /></ProtectedModuleRoute>} />
        <Route path="epis" element={<ProtectedModuleRoute modulo="epis"><EpisList /></ProtectedModuleRoute>} />
        <Route path="equipamentos" element={<ProtectedModuleRoute modulo="equipamentos"><EquipamentosList /></ProtectedModuleRoute>} />
        <Route path="financeiro" element={<ProtectedModuleRoute modulo="financeiro_contas_pagar"><ContasPagarList /></ProtectedModuleRoute>} />
        <Route path="financeiro/contas-pagar" element={<ProtectedModuleRoute modulo="financeiro_contas_pagar"><ContasPagarList /></ProtectedModuleRoute>} />
        <Route path="financeiro/custos-por-obra" element={<ProtectedModuleRoute modulo="financeiro_custos_obra"><CustosPorObra /></ProtectedModuleRoute>} />
        <Route path="usuarios" element={<ProtectedModuleRoute modulo="usuarios"><UsuariosList /></ProtectedModuleRoute>} />
      </Route>
    </Routes>
  );
}

const basename = import.meta.env.PROD ? '/obras' : '/';

export default function App() {
  // O basename deve refletir o "base" configurado no vite.config.js para o Github Pages
  return (
    <Router basename={basename}>
      <AuthProvider>
        <AppRoutes />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </Router>
  );
}
