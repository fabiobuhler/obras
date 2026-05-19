import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import DataTable from '@/shared/DataTable';
import { toast } from 'sonner';
import { Users, Shield, Plus, Edit, Ban, CheckCircle } from 'lucide-react';
import { usuariosService } from '@/services/usuariosService';
import UsuarioPermissoesModal from './UsuarioPermissoesModal';

export default function UsuariosList() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [permissoesModalData, setPermissoesModalData] = useState(null);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    perfil: 'usuario',
    ativo: true,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await usuariosService.getUsuarios();
      setUsuarios(data);
    } catch (err) {
      toast.error('Erro ao carregar usuários.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenForm = (usuario = null) => {
    if (usuario) {
      setFormData({
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        ativo: usuario.ativo,
      });
      setEditing(usuario);
    } else {
      setFormData({ nome: '', email: '', perfil: 'usuario', ativo: true });
      setEditing(null);
    }
    setIsFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.email) {
      return toast.error('Nome e email são obrigatórios.');
    }

    try {
      if (editing) {
        await usuariosService.updateUsuario(editing.id, formData);
        toast.success('Usuário atualizado com sucesso.');
      } else {
        await usuariosService.createUsuario(formData);
        toast.success('Usuário criado. O administrador precisa criar o login deste usuário no Supabase Auth usando o mesmo email.');
      }
      setIsFormOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar usuário.');
      console.error(err);
    }
  };

  const handleToggleAtivo = async (row) => {
    try {
      await usuariosService.updateUsuario(row.id, { ...row, ativo: !row.ativo });
      toast.success(`Usuário ${!row.ativo ? 'ativado' : 'desativado'} com sucesso.`);
      loadData();
    } catch (err) {
      toast.error('Erro ao alterar status do usuário.');
    }
  };

  const columns = [
    { header: 'Nome', accessor: 'nome', render: (row) => <span className="font-medium">{row.nome}</span> },
    { header: 'Email', accessor: 'email', render: (row) => <span className="text-sm">{row.email}</span> },
    { header: 'Perfil', accessor: 'perfil', render: (row) => <span className="uppercase text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">{row.perfil}</span> },
    { header: 'Status Auth', accessor: 'auth', render: (row) => (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${row.auth_user_id ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'}`}>
          {row.auth_user_id ? 'Vinculado' : 'Pendente'}
        </span>
      )
    },
    { header: 'Status Acesso', accessor: 'ativo', render: (row) => (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${row.ativo ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}`}>
          {row.ativo ? 'Ativo' : 'Inativo'}
        </span>
      )
    },
    {
      header: 'Ações',
      accessor: '_acoes',
      render: (row) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <button onClick={() => handleOpenForm(row)} className="flex items-center gap-1 px-2.5 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors font-medium">
            <Edit size={12} /> Editar
          </button>
          <button onClick={() => setPermissoesModalData(row)} className="flex items-center gap-1 px-2.5 py-1 text-xs bg-indigo-600 text-white hover:bg-indigo-700 rounded transition-colors font-medium">
            <Shield size={12} /> Permissões
          </button>
          <button onClick={() => handleToggleAtivo(row)} className={`flex items-center gap-1 px-2.5 py-1 text-xs text-white rounded transition-colors font-medium ${row.ativo ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
            {row.ativo ? <Ban size={12} /> : <CheckCircle size={12} />}
            {row.ativo ? 'Desativar' : 'Ativar'}
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 p-4 rounded-xl">
        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
          <Shield size={16} /> Controle de Acessos
        </h3>
        <p className="text-xs text-blue-700 dark:text-blue-400 mt-1 max-w-3xl">
          Este cadastro controla as permissões de acesso aos módulos do sistema. A criação real do login (senha) deve ser feita pelo administrador no painel do Supabase Auth. Quando o usuário fizer login com o e-mail cadastrado aqui, o sistema vinculará automaticamente o acesso.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2"><Users size={20} /> Usuários e Permissões</CardTitle>
          <button
            onClick={() => handleOpenForm()}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Novo Usuário
          </button>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <DataTable
              columns={columns}
              data={usuarios}
              isLoading={loading}
              searchable={true}
              searchFields={['nome', 'email']}
            />
          </div>
        </CardContent>
      </Card>

      {/* Modal Form */}
      {isFormOpen && (
        <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editing ? 'Editar Usuário' : 'Novo Usuário'}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full border border-input rounded-md px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Nome completo"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-input rounded-md px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="usuario@empresa.com.br"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Perfil</label>
                <select
                  value={formData.perfil}
                  onChange={(e) => setFormData({ ...formData, perfil: e.target.value })}
                  className="w-full border border-input rounded-md px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="admin">Admin</option>
                  <option value="gestor">Gestor</option>
                  <option value="usuario">Usuário Normal</option>
                  <option value="consulta">Apenas Consulta</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={formData.ativo.toString()}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.value === 'true' })}
                  className="w-full border border-input rounded-md px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 text-sm font-medium border border-input rounded-md hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Salvar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Permissões */}
      {permissoesModalData && (
        <UsuarioPermissoesModal
          isOpen={!!permissoesModalData}
          onClose={() => setPermissoesModalData(null)}
          usuario={permissoesModalData}
        />
      )}
    </div>
  );
}
