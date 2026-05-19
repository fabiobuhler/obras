import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { ButtonNovo } from '@/components/ui/ActionButtons';
import DataTable from '@/shared/DataTable';
import { toast } from 'sonner';
import { equipamentosService } from '@/services/equipamentosService';
import EquipamentoForm from './EquipamentoForm';
import { EquipamentoDetalhes } from './EquipamentoDetalhes';

export default function EquipamentosList() {
  const [equipamentos, setEquipamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deleteData, setDeleteData] = useState({ isOpen: false, record: null });
  
  const [viewingRecord, setViewingRecord] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await equipamentosService.getAll();
      setEquipamentos(data);
    } catch (error) {
      toast.error('Erro ao carregar equipamentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (equipamentoPayload, locacaoPayload) => {
    try {
      if (editingRecord) {
        // Edição: atualiza equipamento e cria locação se mudou para locado e não há locação ativa
        const cleanData = { ...equipamentoPayload };
        delete cleanData.id;
        const { locacaoCriada, locacaoJaExistia } = await equipamentosService.updateComLocacao(
          editingRecord.id,
          cleanData,
          locacaoPayload
        );

        toast.success('Equipamento atualizado com sucesso!');
        if (locacaoCriada) {
          toast.success('Locação criada automaticamente!');
        } else if (locacaoJaExistia) {
          toast('Já existe uma locação ativa para este equipamento.', { icon: 'ℹ️' });
        }
      } else {
        // Novo: cria equipamento e, se locado, a locação automaticamente
        await equipamentosService.createComLocacao(equipamentoPayload, locacaoPayload);
        toast.success(
          locacaoPayload
            ? 'Equipamento criado e locação registrada!'
            : 'Equipamento criado com sucesso!'
        );
      }
      setIsModalOpen(false);
      setEditingRecord(null);
      loadData();
    } catch (error) {
      console.error('ERRO EQUIPAMENTO:', error);
      toast.error(error.message || 'Erro ao salvar equipamento');
    }
  };

  const confirmDelete = async () => {
    try {
      await equipamentosService.deleteComDependencias(deleteData.record.id);
      toast.success('Equipamento excluído com sucesso!');
      setDeleteData({ isOpen: false, record: null });
      loadData();
    } catch (error) {
      console.error('ERRO AO EXCLUIR EQUIPAMENTO:', error);
      toast.error(error.message || 'Erro ao excluir equipamento');
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleDelete = (record) => {
    setDeleteData({ isOpen: true, record });
  };

  const handleView = (record) => {
    setViewingRecord(record);
    setIsViewModalOpen(true);
  };

  const renderBadge = (status) => {
    if (!status) return '-';
    let color = 'bg-gray-100 text-gray-700';
    if (status === 'disponível') color = 'bg-green-100 text-green-700';
    if (status === 'em uso') color = 'bg-blue-100 text-blue-700';
    if (status === 'manutenção') color = 'bg-red-100 text-red-700';
    if (status === 'devolvido') color = 'bg-gray-100 text-gray-500';
    if (status === 'inativo') color = 'bg-zinc-200 text-zinc-600';
    return <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${color}`}>{status}</span>;
  };

  const columns = [
    { header: 'Código', accessor: 'codigo', render: (row) => row.codigo || '-' },
    { header: 'Descrição', accessor: 'descricao' },
    { header: 'Tipo', accessor: 'tipo', render: (row) => row.tipo || '-' },
    { header: 'Origem', accessor: 'origem', render: (row) => <span className="capitalize">{row.origem || '-'}</span> },
    { header: 'Situação', accessor: 'situacao', render: (row) => renderBadge(row.situacao) },
    { header: 'Patrimônio', accessor: 'patrimonio', render: (row) => row.patrimonio || '-' },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recursos e Equipamentos</CardTitle>
          <ButtonNovo onClick={() => { setEditingRecord(null); setIsModalOpen(true); }}>Novo Equipamento</ButtonNovo>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={equipamentos}
            isLoading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            searchable={true}
            searchFields={['descricao', 'codigo', 'origem']}
          />
        </CardContent>
      </Card>

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingRecord ? 'Editar Equipamento' : 'Novo Equipamento'}
          size="lg"
        >
          <EquipamentoForm
            initialData={editingRecord}
            onSubmit={handleSubmit}
            onCancel={() => setIsModalOpen(false)}
          />
        </Modal>
      )}

      {deleteData.isOpen && (
        <ConfirmModal
          isOpen={deleteData.isOpen}
          onClose={() => setDeleteData({ isOpen: false, record: null })}
          onConfirm={confirmDelete}
          title="Excluir Equipamento"
          message={`Tem certeza que deseja excluir o equipamento "${deleteData.record?.descricao}"? Esta ação não pode ser desfeita e excluirá também todas as movimentações e manutenções atreladas.`}
        />
      )}

      {isViewModalOpen && viewingRecord && (
        <EquipamentoDetalhes
          isOpen={isViewModalOpen}
          onClose={() => { setIsViewModalOpen(false); loadData(); }}
          equipamento={viewingRecord}
        />
      )}
    </div>
  );
}
