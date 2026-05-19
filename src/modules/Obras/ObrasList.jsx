import { useEffect, useState } from 'react';
import { useCrud } from '@/hooks/useCrud';
import { obrasService } from '@/services/obrasService';
import DataTable from '@/shared/DataTable';
import { Modal } from '@/components/ui/Modal';
import ObraForm from './ObraForm';
import { formatDate } from '@/lib/formatters';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { ButtonNovo } from '@/components/ui/ActionButtons';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

export default function ObrasList() {
  const { data, loading, error, loadData, deleteRecord, createRecord, updateRecord } = useCrud(obrasService);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deleteData, setDeleteData] = useState({ isOpen: false, record: null });

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns = [
    { header: 'Objeto da Obra', accessor: 'objeto' },
    { header: 'Status', accessor: 'status' },
    { header: 'Data Início', accessor: 'data_inicio', render: (row) => formatDate(row.data_inicio) },
    { header: 'Data Fim', accessor: 'data_fim', render: (row) => formatDate(row.data_fim) },
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
        title="Obras" 
        description="Acompanhamento e gestão das obras civis"
        actions={<ButtonNovo onClick={() => handleOpenModal()}>Nova Obra</ButtonNovo>}
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
        title={editingRecord ? 'Editar Obra' : 'Nova Obra'}
      >
        <ObraForm
          initialData={editingRecord}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>

      <ConfirmModal
        isOpen={deleteData.isOpen}
        onClose={() => setDeleteData({ isOpen: false, record: null })}
        onConfirm={confirmDelete}
        title="Excluir Obra"
        message={`Tem certeza que deseja excluir a obra ${deleteData.record?.objeto}? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}
