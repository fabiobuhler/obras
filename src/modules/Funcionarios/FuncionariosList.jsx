import { useEffect, useState } from 'react';
import { useCrud } from '@/hooks/useCrud';
import { funcionariosService } from '@/services/funcionariosService';
import DataTable from '@/shared/DataTable';
import { Modal } from '@/components/ui/Modal';
import FuncionarioForm from './FuncionarioForm';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { ButtonNovo } from '@/components/ui/ActionButtons';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { formatCurrency } from '@/lib/formatters';
import { FuncionarioDetalhes } from './FuncionarioDetalhes';

export default function FuncionariosList() {
  const { data, loading, error, loadData, deleteRecord, createRecord, updateRecord } = useCrud(funcionariosService);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [deleteData, setDeleteData] = useState({ isOpen: false, record: null });

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns = [
    { header: 'Nome', accessor: 'pessoas.nome', render: (row) => row.pessoas?.nome || 'N/A' },
    { header: 'Cargo', accessor: 'cargo' },
    { header: 'Função', accessor: 'funcao' },
    { header: 'Salário', accessor: 'salario', render: (row) => formatCurrency(row.salario) },
    { 
      header: 'Status', 
      accessor: 'ativo',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.ativo ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
          {row.ativo ? 'Ativo' : 'Inativo'}
        </span>
      )
    },
  ];

  const handleOpenModal = (record = null) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingRecord(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (formData) => {
    if (editingRecord) {
      await updateRecord(editingRecord.id, formData);
    } else {
      await createRecord(formData);
    }
    handleCloseModal();
  };

  const requestDelete = (record) => {
    setDeleteData({ isOpen: true, record });
  };

  const confirmDelete = async () => {
    if (deleteData.record) {
      await deleteRecord(deleteData.record.id);
      setDeleteData({ isOpen: false, record: null });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Funcionários" 
        description="Gestão de colaboradores vinculados às pessoas cadastradas"
        actions={<ButtonNovo onClick={() => handleOpenModal()}>Novo Funcionário</ButtonNovo>}
      />

      <Card>
        <CardContent className="pt-6">
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}

          <DataTable
            columns={columns}
            data={data}
            isLoading={loading}
            onView={(record) => setViewingRecord(record)}
            onEdit={handleOpenModal}
            onDelete={requestDelete}
          />
        </CardContent>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        title={editingRecord ? 'Editar Funcionário' : 'Novo Funcionário'}
      >
        <FuncionarioForm
          initialData={editingRecord}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>

      <ConfirmModal
        isOpen={deleteData.isOpen}
        onClose={() => setDeleteData({ isOpen: false, record: null })}
        onConfirm={confirmDelete}
        title="Excluir Funcionário"
        message={`Tem certeza que deseja inativar/excluir o funcionário ${deleteData.record?.pessoas?.nome}? Esta ação não pode ser desfeita.`}
      />

      <FuncionarioDetalhes
        isOpen={!!viewingRecord}
        onClose={() => setViewingRecord(null)}
        funcionario={viewingRecord}
      />
    </div>
  );
}
