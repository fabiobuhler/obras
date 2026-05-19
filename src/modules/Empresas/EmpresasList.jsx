import { useEffect, useState } from 'react';
import { useCrud } from '@/hooks/useCrud';
import { empresasService } from '@/services/empresasService';
import DataTable from '@/shared/DataTable';
import { Modal } from '@/components/ui/Modal';
import EmpresaForm from './EmpresaForm';
import { formatCNPJ } from '@/lib/formatters';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { ButtonNovo } from '@/components/ui/ActionButtons';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

export default function EmpresasList() {
  const { data, loading, error, loadData, deleteRecord, createRecord, updateRecord } = useCrud(empresasService);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deleteData, setDeleteData] = useState({ isOpen: false, record: null });

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns = [
    { header: 'Razão Social', accessor: 'razao_social' },
    { header: 'Nome Fantasia', accessor: 'nome_fantasia' },
    { header: 'CNPJ', accessor: 'cnpj', render: (row) => formatCNPJ(row.cnpj) },
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
        title="Empresas e Fornecedores" 
        description="Gerencie as empresas e seus respectivos contatos principais"
        actions={<ButtonNovo onClick={() => handleOpenModal()}>Adicionar Empresa</ButtonNovo>}
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
            onEdit={handleOpenModal}
            onDelete={requestDelete}
          />
        </CardContent>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        title={editingRecord ? 'Editar Empresa' : 'Nova Empresa'}
      >
        <EmpresaForm
          initialData={editingRecord}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>

      <ConfirmModal
        isOpen={deleteData.isOpen}
        onClose={() => setDeleteData({ isOpen: false, record: null })}
        onConfirm={confirmDelete}
        title="Excluir Empresa"
        message={`Tem certeza que deseja excluir ${deleteData.record?.razao_social}? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}
