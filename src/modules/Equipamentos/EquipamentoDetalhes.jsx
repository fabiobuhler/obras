import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ButtonNovo } from '@/components/ui/ActionButtons';
import DataTable from '@/shared/DataTable';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { toast } from 'sonner';

import { equipamentoMovimentacoesService } from '@/services/equipamentoMovimentacoesService';
import { equipamentoLocacoesService } from '@/services/equipamentoLocacoesService';
import { equipamentoManutencoesService } from '@/services/equipamentoManutencoesService';
import { equipamentoAbastecimentosService } from '@/services/equipamentoAbastecimentosService';

import MovimentacaoForm from './MovimentacaoForm';
import LocacaoForm from './LocacaoForm';
import ManutencaoForm from './ManutencaoForm';
import AbastecimentoForm from './AbastecimentoForm';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

export function EquipamentoDetalhes({ isOpen, onClose, equipamento }) {
  const [activeTab, setActiveTab] = useState('gerais');

  // Movimentações
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loadingMovimentacoes, setLoadingMovimentacoes] = useState(false);
  const [isMovModalOpen, setIsMovModalOpen] = useState(false);
  const [editingMov, setEditingMov] = useState(null);
  const [deleteMovData, setDeleteMovData] = useState({ isOpen: false, record: null });

  // Locações
  const [locacoes, setLocacoes] = useState([]);
  const [loadingLocacoes, setLoadingLocacoes] = useState(false);
  const [isLocModalOpen, setIsLocModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState(null);
  const [deleteLocData, setDeleteLocData] = useState({ isOpen: false, record: null });

  // Manutenções
  const [manutencoes, setManutencoes] = useState([]);
  const [loadingManutencoes, setLoadingManutencoes] = useState(false);
  const [isManModalOpen, setIsManModalOpen] = useState(false);
  const [editingMan, setEditingMan] = useState(null);
  const [deleteManData, setDeleteManData] = useState({ isOpen: false, record: null });

  // Abastecimentos
  const [abastecimentos, setAbastecimentos] = useState([]);
  const [loadingAbastecimentos, setLoadingAbastecimentos] = useState(false);
  const [isAbaModalOpen, setIsAbaModalOpen] = useState(false);
  const [editingAba, setEditingAba] = useState(null);
  const [deleteAbaData, setDeleteAbaData] = useState({ isOpen: false, record: null });

  useEffect(() => {
    if (isOpen && equipamento) {
      setActiveTab('gerais');
      loadAllData();
    }
  }, [isOpen, equipamento]);

  const loadAllData = () => {
    loadMovimentacoes();
    loadLocacoes();
    loadManutencoes();
    loadAbastecimentos();
  };

  // --- Movimentações ---
  const loadMovimentacoes = async () => {
    try {
      setLoadingMovimentacoes(true);
      setMovimentacoes(await equipamentoMovimentacoesService.getByEquipamento(equipamento.id));
    } catch (error) { toast.error('Erro ao carregar Movimentações'); } 
    finally { setLoadingMovimentacoes(false); }
  };
  const handleMovSubmit = async (formData) => {
    try {
      const cleanData = { ...formData };
      delete cleanData.id;
      if (editingMov?.id) await equipamentoMovimentacoesService.update(editingMov.id, cleanData);
      else await equipamentoMovimentacoesService.create(cleanData);
      toast.success('Movimentação salva');
      setIsMovModalOpen(false); setEditingMov(null);
      loadMovimentacoes();
    } catch (error) { toast.error('Erro ao salvar Movimentação'); }
  };
  const confirmDeleteMov = async () => {
    try {
      await equipamentoMovimentacoesService.delete(deleteMovData.record.id);
      toast.success('Movimentação excluída');
      setDeleteMovData({ isOpen: false, record: null });
      loadMovimentacoes();
    } catch (error) { toast.error('Erro ao excluir Movimentação'); }
  };

  // --- Locações ---
  const loadLocacoes = async () => {
    try {
      setLoadingLocacoes(true);
      setLocacoes(await equipamentoLocacoesService.getByEquipamento(equipamento.id));
    } catch (error) { toast.error('Erro ao carregar Locações'); } 
    finally { setLoadingLocacoes(false); }
  };
  const handleLocSubmit = async (formData) => {
    try {
      const cleanData = { ...formData };
      delete cleanData.id;
      if (editingLoc?.id) await equipamentoLocacoesService.update(editingLoc.id, cleanData);
      else await equipamentoLocacoesService.create(cleanData);
      toast.success('Locação salva');
      setIsLocModalOpen(false); setEditingLoc(null);
      loadLocacoes();
    } catch (error) { toast.error('Erro ao salvar Locação'); }
  };
  const confirmDeleteLoc = async () => {
    try {
      await equipamentoLocacoesService.delete(deleteLocData.record.id);
      toast.success('Locação excluída');
      setDeleteLocData({ isOpen: false, record: null });
      loadLocacoes();
    } catch (error) { toast.error('Erro ao excluir Locação'); }
  };

  // --- Manutenções ---
  const loadManutencoes = async () => {
    try {
      setLoadingManutencoes(true);
      setManutencoes(await equipamentoManutencoesService.getByEquipamento(equipamento.id));
    } catch (error) { toast.error('Erro ao carregar Manutenções'); } 
    finally { setLoadingManutencoes(false); }
  };
  const handleManSubmit = async (formData) => {
    try {
      const cleanData = { ...formData };
      delete cleanData.id;
      if (editingMan?.id) await equipamentoManutencoesService.update(editingMan.id, cleanData);
      else await equipamentoManutencoesService.create(cleanData);
      toast.success('Manutenção salva');
      setIsManModalOpen(false); setEditingMan(null);
      loadManutencoes();
    } catch (error) { toast.error('Erro ao salvar Manutenção'); }
  };
  const confirmDeleteMan = async () => {
    try {
      await equipamentoManutencoesService.delete(deleteManData.record.id);
      toast.success('Manutenção excluída');
      setDeleteManData({ isOpen: false, record: null });
      loadManutencoes();
    } catch (error) { toast.error('Erro ao excluir Manutenção'); }
  };

  // --- Abastecimentos ---
  const loadAbastecimentos = async () => {
    try {
      setLoadingAbastecimentos(true);
      setAbastecimentos(await equipamentoAbastecimentosService.getByEquipamento(equipamento.id));
    } catch (error) { toast.error('Erro ao carregar Abastecimentos'); } 
    finally { setLoadingAbastecimentos(false); }
  };
  const handleAbaSubmit = async (formData) => {
    try {
      const cleanData = { ...formData };
      delete cleanData.id;
      if (editingAba?.id) await equipamentoAbastecimentosService.update(editingAba.id, cleanData);
      else await equipamentoAbastecimentosService.create(cleanData);
      toast.success('Abastecimento salvo');
      setIsAbaModalOpen(false); setEditingAba(null);
      loadAbastecimentos();
    } catch (error) { toast.error('Erro ao salvar Abastecimento'); }
  };
  const confirmDeleteAba = async () => {
    try {
      await equipamentoAbastecimentosService.delete(deleteAbaData.record.id);
      toast.success('Abastecimento excluído');
      setDeleteAbaData({ isOpen: false, record: null });
      loadAbastecimentos();
    } catch (error) { toast.error('Erro ao excluir Abastecimento'); }
  };

  if (!equipamento) return null;

  const renderBadge = (status) => {
    if (!status) return '-';
    let color = 'bg-gray-100 text-gray-700';
    if (['disponível', 'concluída', 'ativa'].includes(status)) color = 'bg-green-100 text-green-700';
    if (['em uso', 'em andamento'].includes(status)) color = 'bg-blue-100 text-blue-700';
    if (['manutenção', 'vencida', 'cancelada'].includes(status)) color = 'bg-red-100 text-red-700';
    if (['entrada'].includes(status)) color = 'bg-teal-100 text-teal-700';
    if (['saída'].includes(status)) color = 'bg-orange-100 text-orange-700';
    return <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${color}`}>{status}</span>;
  };

  const linkRenderer = (url) => {
    if (!url) return '-';
    return <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs">Abrir Arquivo</a>;
  };

  const movColumns = [
    { header: 'Data', accessor: 'data_movimentacao', render: (row) => formatDate(row.data_movimentacao) },
    { header: 'Tipo', accessor: 'tipo_movimentacao', render: (row) => renderBadge(row.tipo_movimentacao) },
    { header: 'Origem', accessor: 'obra_origem_id', render: (row) => row.obra_origem?.nome_obra || '-' },
    { header: 'Destino', accessor: 'obra_destino_id', render: (row) => row.obra_destino?.nome_obra || '-' },
    { header: 'Responsável', accessor: 'responsavel_id', render: (row) => row.pessoas?.nome || '-' },
  ];

  const locColumns = [
    { header: 'Data Início', accessor: 'data_inicio', render: (row) => formatDate(row.data_inicio) },
    { header: 'Obra', accessor: 'obra_id', render: (row) => row.obras?.nome_obra || '-' },
    { header: 'Fornecedor', accessor: 'fornecedor_id', render: (row) => row.empresas?.nome_fantasia || '-' },
    { header: 'Devolução Prev.', accessor: 'previsao_devolucao', render: (row) => formatDate(row.previsao_devolucao) },
    { header: 'Valor', accessor: 'valor', render: (row) => formatCurrency(row.valor) },
    { header: 'Status', accessor: 'status', render: (row) => renderBadge(row.status) },
  ];

  const manColumns = [
    { header: 'Início', accessor: 'data_inicio', render: (row) => formatDate(row.data_inicio) },
    { header: 'Tipo', accessor: 'tipo_manutencao', render: (row) => <span className="capitalize">{row.tipo_manutencao}</span> },
    { header: 'Oficina', accessor: 'fornecedor_id', render: (row) => row.empresas?.nome_fantasia || '-' },
    { header: 'Valor', accessor: 'valor', render: (row) => formatCurrency(row.valor) },
    { header: 'Status', accessor: 'status', render: (row) => renderBadge(row.status) },
    { header: 'OS/Nota', accessor: 'arquivo_url', render: (row) => linkRenderer(row.arquivo_url) },
  ];

  const abaColumns = [
    { header: 'Data', accessor: 'data_abastecimento', render: (row) => formatDate(row.data_abastecimento) },
    { header: 'Litros', accessor: 'litros', render: (row) => row.litros ? `${row.litros} L` : '-' },
    { header: 'Total', accessor: 'valor_total', render: (row) => formatCurrency(row.valor_total) },
    { header: 'Obra', accessor: 'obra_id', render: (row) => row.obras?.nome_obra || '-' },
    { header: 'Comprovante', accessor: 'arquivo_url', render: (row) => linkRenderer(row.arquivo_url) },
  ];

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Detalhes do Equipamento: ${equipamento.descricao}`} size="xl">
        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-md grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs font-semibold">Código</p>
              <p className="font-medium">{equipamento.codigo || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-semibold">Origem</p>
              <p className="font-medium capitalize">{equipamento.origem || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-semibold">Obra Atual</p>
              <p className="font-medium truncate">{equipamento.obras?.nome_obra || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-semibold">Situação</p>
              {renderBadge(equipamento.situacao)}
            </div>
          </div>

          <div className="border-b border-gray-200 dark:border-gray-700 flex space-x-4 overflow-x-auto">
            {[
              { id: 'gerais', label: 'Dados Gerais' },
              { id: 'movs', label: 'Movimentações' },
              { id: 'locs', label: 'Locações' },
              { id: 'mans', label: 'Manutenções' },
              { id: 'abas', label: 'Abastecimentos' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="py-2 min-h-[300px]">
            {activeTab === 'gerais' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 border-b pb-1 mb-2">Identificação</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <p className="text-gray-500">Fabricante:</p>
                      <p className="font-medium">{equipamento.fabricante || '-'}</p>
                      <p className="text-gray-500">Modelo:</p>
                      <p className="font-medium">{equipamento.modelo || '-'}</p>
                      <p className="text-gray-500">Nº Série:</p>
                      <p className="font-medium">{equipamento.numero_serie || '-'}</p>
                      <p className="text-gray-500">Patrimônio:</p>
                      <p className="font-medium">{equipamento.patrimonio || '-'}</p>
                      <p className="text-gray-500">Ano:</p>
                      <p className="font-medium">{equipamento.ano || '-'}</p>
                    </div>
                  </div>
                  {equipamento.arquivo_url && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 border-b pb-1 mb-2">Documentação</h4>
                      <a href={equipamento.arquivo_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Ver Documento do Equipamento</a>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 border-b pb-1 mb-2">Operação</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <p className="text-gray-500">Horímetro Atual:</p>
                      <p className="font-medium">{equipamento.horimetro || '-'}</p>
                      <p className="text-gray-500">Hodômetro Atual:</p>
                      <p className="font-medium">{equipamento.hodometro || '-'}</p>
                      <p className="text-gray-500">Fornecedor:</p>
                      <p className="font-medium">{equipamento.empresas?.nome_fantasia || '-'}</p>
                      <p className="text-gray-500">Responsável:</p>
                      <p className="font-medium">{equipamento.pessoas?.nome || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'movs' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Histórico de Movimentações</h3>
                  <ButtonNovo onClick={() => { setEditingMov(null); setIsMovModalOpen(true); }}>Nova Movimentação</ButtonNovo>
                </div>
                <DataTable columns={movColumns} data={movimentacoes} isLoading={loadingMovimentacoes} onEdit={(record) => { setEditingMov(record); setIsMovModalOpen(true); }} onDelete={(record) => setDeleteMovData({ isOpen: true, record })} />
              </div>
            )}

            {activeTab === 'locs' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Contratos de Locação</h3>
                  <ButtonNovo onClick={() => { setEditingLoc(null); setIsLocModalOpen(true); }}>Nova Locação</ButtonNovo>
                </div>
                <DataTable columns={locColumns} data={locacoes} isLoading={loadingLocacoes} onEdit={(record) => { setEditingLoc(record); setIsLocModalOpen(true); }} onDelete={(record) => setDeleteLocData({ isOpen: true, record })} />
              </div>
            )}

            {activeTab === 'mans' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Histórico de Manutenções</h3>
                  <ButtonNovo onClick={() => { setEditingMan(null); setIsManModalOpen(true); }}>Nova Manutenção</ButtonNovo>
                </div>
                <DataTable columns={manColumns} data={manutencoes} isLoading={loadingManutencoes} onEdit={(record) => { setEditingMan(record); setIsManModalOpen(true); }} onDelete={(record) => setDeleteManData({ isOpen: true, record })} />
              </div>
            )}

            {activeTab === 'abas' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Abastecimentos</h3>
                  <ButtonNovo onClick={() => { setEditingAba(null); setIsAbaModalOpen(true); }}>Novo Abastecimento</ButtonNovo>
                </div>
                <DataTable columns={abaColumns} data={abastecimentos} isLoading={loadingAbastecimentos} onEdit={(record) => { setEditingAba(record); setIsAbaModalOpen(true); }} onDelete={(record) => setDeleteAbaData({ isOpen: true, record })} />
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-zinc-800">
            <button onClick={onClose} className="px-4 py-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent hover:bg-gray-100 text-sm font-medium">Fechar Detalhes</button>
          </div>
        </div>
      </Modal>

      {isMovModalOpen && (
        <Modal isOpen={isMovModalOpen} onClose={() => setIsMovModalOpen(false)} title={editingMov?.id ? 'Editar Movimentação' : 'Nova Movimentação'}>
          <MovimentacaoForm initialData={editingMov} equipamentoId={equipamento.id} onSubmit={handleMovSubmit} onCancel={() => setIsMovModalOpen(false)} />
        </Modal>
      )}
      {deleteMovData.isOpen && <ConfirmModal isOpen={deleteMovData.isOpen} onClose={() => setDeleteMovData({ isOpen: false, record: null })} onConfirm={confirmDeleteMov} title="Excluir" message="Excluir movimentação?" />}

      {isLocModalOpen && (
        <Modal isOpen={isLocModalOpen} onClose={() => setIsLocModalOpen(false)} title={editingLoc?.id ? 'Editar Locação' : 'Nova Locação'}>
          <LocacaoForm initialData={editingLoc} equipamentoId={equipamento.id} onSubmit={handleLocSubmit} onCancel={() => setIsLocModalOpen(false)} />
        </Modal>
      )}
      {deleteLocData.isOpen && <ConfirmModal isOpen={deleteLocData.isOpen} onClose={() => setDeleteLocData({ isOpen: false, record: null })} onConfirm={confirmDeleteLoc} title="Excluir" message="Excluir locação?" />}

      {isManModalOpen && (
        <Modal isOpen={isManModalOpen} onClose={() => setIsManModalOpen(false)} title={editingMan?.id ? 'Editar Manutenção' : 'Nova Manutenção'}>
          <ManutencaoForm initialData={editingMan} equipamentoId={equipamento.id} onSubmit={handleManSubmit} onCancel={() => setIsManModalOpen(false)} />
        </Modal>
      )}
      {deleteManData.isOpen && <ConfirmModal isOpen={deleteManData.isOpen} onClose={() => setDeleteManData({ isOpen: false, record: null })} onConfirm={confirmDeleteMan} title="Excluir" message="Excluir manutenção?" />}

      {isAbaModalOpen && (
        <Modal isOpen={isAbaModalOpen} onClose={() => setIsAbaModalOpen(false)} title={editingAba?.id ? 'Editar Abastecimento' : 'Novo Abastecimento'}>
          <AbastecimentoForm initialData={editingAba} equipamentoId={equipamento.id} onSubmit={handleAbaSubmit} onCancel={() => setIsAbaModalOpen(false)} />
        </Modal>
      )}
      {deleteAbaData.isOpen && <ConfirmModal isOpen={deleteAbaData.isOpen} onClose={() => setDeleteAbaData({ isOpen: false, record: null })} onConfirm={confirmDeleteAba} title="Excluir" message="Excluir abastecimento?" />}
    </>
  );
}
