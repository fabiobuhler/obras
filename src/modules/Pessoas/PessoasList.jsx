import { useEffect, useState } from 'react';
import { useCrud } from '@/hooks/useCrud';
import { pessoasService } from '@/services/pessoasService';
import DataTable from '@/shared/DataTable';
import { Modal } from '@/components/ui/Modal';
import PessoaForm from './PessoaForm';
import { formatCPF, formatPhone } from '@/lib/formatters';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { ButtonNovo } from '@/components/ui/ActionButtons';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

export default function PessoasList() {
  const { data, loading, error, loadData, deleteRecord, createRecord, updateRecord } = useCrud(pessoasService);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const [deleteData, setDeleteData] = useState({ isOpen: false, record: null });

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns = [
    { header: 'Nome', accessor: 'nome' },
    { header: 'CPF', accessor: 'cpf', render: (row) => formatCPF(row.cpf) },
    { header: 'Tipo', accessor: 'tipo_pessoa' },
    { 
      header: 'Telefone', 
      accessor: 'telefone1', 
      render: (row) => (
        <div className="flex items-center gap-2">
          {formatPhone(row.telefone1)}
          {row.telefone1_whatsapp && <WhatsAppButton phone={row.telefone1} />}
        </div>
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
        title="Pessoas" 
        description="Gerencie os funcionários, clientes e contatos"
        actions={<ButtonNovo onClick={() => handleOpenModal()}>Adicionar Pessoa</ButtonNovo>}
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
        title={editingRecord ? 'Editar Pessoa' : 'Nova Pessoa'}
      >
        <PessoaForm
          initialData={editingRecord}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>

      <ConfirmModal
        isOpen={deleteData.isOpen}
        onClose={() => setDeleteData({ isOpen: false, record: null })}
        onConfirm={confirmDelete}
        title="Excluir Pessoa"
        message={`Tem certeza que deseja excluir ${deleteData.record?.nome}? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}
