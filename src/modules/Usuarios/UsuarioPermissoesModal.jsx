import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';
import { ShieldAlert, Save } from 'lucide-react';
import { usuariosService } from '@/services/usuariosService';

export default function UsuarioPermissoesModal({ isOpen, onClose, usuario }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissoes, setPermissoes] = useState([]);

  useEffect(() => {
    if (isOpen && usuario) {
      loadPermissoes();
    }
  }, [isOpen, usuario]);

  const loadPermissoes = async () => {
    setLoading(true);
    try {
      const data = await usuariosService.getUsuarioComPermissoes(usuario.id);
      setPermissoes(data.permissoes);
    } catch (err) {
      toast.error('Erro ao carregar permissões do usuário.');
      console.error(err);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (moduloId, campo, value) => {
    setPermissoes((prev) =>
      prev.map((p) => {
        if (p.modulo_id !== moduloId) return p;

        const updated = { ...p, [campo]: value };

        // Lógica automática
        if (campo === 'pode_visualizar' && value === false) {
          updated.pode_criar = false;
          updated.pode_editar = false;
          updated.pode_excluir = false;
        }

        if (['pode_criar', 'pode_editar', 'pode_excluir'].includes(campo) && value === true) {
          updated.pode_visualizar = true;
        }

        return updated;
      })
    );
  };

  const handleLiberarTodos = () => {
    setPermissoes((prev) =>
      prev.map((p) => ({
        ...p,
        pode_visualizar: true,
        pode_criar: true,
        pode_editar: true,
        pode_excluir: true,
      }))
    );
  };

  const handleSomenteVisualizar = () => {
    setPermissoes((prev) =>
      prev.map((p) => ({
        ...p,
        pode_visualizar: true,
        pode_criar: false,
        pode_editar: false,
        pode_excluir: false,
      }))
    );
  };

  const handleBloquearEmTeste = () => {
    setPermissoes((prev) =>
      prev.map((p) => {
        if (p.modulo.em_teste) {
          return {
            ...p,
            pode_visualizar: false,
            pode_criar: false,
            pode_editar: false,
            pode_excluir: false,
          };
        }
        return p;
      })
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await usuariosService.updatePermissoes(usuario.id, permissoes);
      toast.success('Permissões atualizadas com sucesso.');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar permissões.');
    } finally {
      setSaving(false);
    }
  };

  if (usuario?.perfil === 'admin') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={`Permissões: ${usuario.nome}`} size="xl">
        <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-4">
          <ShieldAlert size={48} className="text-blue-500" />
          <h3 className="text-xl font-bold text-foreground">Acesso Administrador</h3>
          <p className="max-w-md text-sm">
            Este usuário possui perfil de <strong>Admin</strong>. Administradores possuem acesso total irrestrito a todos os módulos do sistema. Não é necessário configurar permissões individuais.
          </p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">
            Entendi, fechar
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Permissões: ${usuario?.nome}`} size="4xl">
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 pb-2">
            <button type="button" onClick={handleLiberarTodos} className="text-xs px-3 py-1.5 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800 rounded font-medium hover:bg-green-100 dark:hover:bg-green-900/50">
              Liberar Tudo
            </button>
            <button type="button" onClick={handleSomenteVisualizar} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50">
              Somente Visualizar
            </button>
            <button type="button" onClick={handleBloquearEmTeste} className="text-xs px-3 py-1.5 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800 rounded font-medium hover:bg-yellow-100 dark:hover:bg-yellow-900/50">
              Bloquear "Em Teste"
            </button>
          </div>

          <div className="w-full overflow-x-auto border rounded-lg border-border">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs uppercase bg-muted text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3">Módulo</th>
                  <th className="px-4 py-3 text-center">Visualizar</th>
                  <th className="px-4 py-3 text-center">Criar</th>
                  <th className="px-4 py-3 text-center">Editar</th>
                  <th className="px-4 py-3 text-center">Excluir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {permissoes.map((p) => (
                  <tr key={p.modulo_id} className="hover:bg-muted/50 bg-background transition-colors">
                    <td className="px-4 py-2 font-medium flex items-center gap-2">
                      {p.modulo.nome}
                      {p.modulo.em_teste && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded uppercase font-bold tracking-wider">Teste</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input type="checkbox" className="w-4 h-4 cursor-pointer accent-primary" checked={p.pode_visualizar} onChange={(e) => handleToggle(p.modulo_id, 'pode_visualizar', e.target.checked)} />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input type="checkbox" className="w-4 h-4 cursor-pointer accent-primary" checked={p.pode_criar} onChange={(e) => handleToggle(p.modulo_id, 'pode_criar', e.target.checked)} />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input type="checkbox" className="w-4 h-4 cursor-pointer accent-primary" checked={p.pode_editar} onChange={(e) => handleToggle(p.modulo_id, 'pode_editar', e.target.checked)} />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input type="checkbox" className="w-4 h-4 cursor-pointer accent-primary" checked={p.pode_excluir} onChange={(e) => handleToggle(p.modulo_id, 'pode_excluir', e.target.checked)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium border border-input rounded-md hover:bg-muted"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Salvando...' : 'Salvar Permissões'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
