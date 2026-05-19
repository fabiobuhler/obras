import { useEffect, useState } from 'react';
import { useCrud } from '@/hooks/useCrud';
import { episService } from '@/services/episService';
import DataTable from '@/shared/DataTable';
import { Modal } from '@/components/ui/Modal';
import EpiForm from './EpiForm';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { ButtonNovo } from '@/components/ui/ActionButtons';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { formatDate } from '@/lib/formatters';
import { FichaEpiModal } from './FichaEpiModal';
import { RelatorioEpiModal } from './RelatorioEpiModal';
import { useMemo } from 'react';

export default function EpisList() {
  const { data, loading, error, loadData, deleteRecord, createRecord, updateRecord } = useCrud(episService);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deleteData, setDeleteData] = useState({ isOpen: false, record: null });

  const funcionariosUnicos = useMemo(() => {
    const map = new Map();
    data.forEach(epi => {
      if (epi.funcionarios && !map.has(epi.funcionario_id)) {
        map.set(epi.funcionario_id, epi.funcionarios);
      }
    });
    return Array.from(map.values());
  }, [data]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns = [
    { header: 'Funcionário', accessor: 'funcionarios.pessoas.nome', render: (row) => row.funcionarios?.pessoas?.nome || 'N/A' },
    { header: 'EPI', accessor: 'epi' },
    { header: 'C.A.', accessor: 'ca', render: (row) => row.ca || '-' },
    { header: 'Entrega', accessor: 'data_entrega', render: (row) => formatDate(row.data_entrega) || '-' },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (row) => {
        let badgeColor = 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
        if (row.status === 'Entregue' || row.status === 'Em uso') badgeColor = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        if (row.status === 'Vencido') badgeColor = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
        if (row.status === 'Baixado') badgeColor = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';

        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
            {row.status}
          </span>
        );
      }
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
        title="Controle de EPIs" 
        description="Gerenciamento de Equipamentos de Proteção Individual dos funcionários"
        actions={<ButtonNovo onClick={() => handleOpenModal()}>Novo EPI</ButtonNovo>}
        showPrint={true}
        showReport={true}
        onPrintClick={() => setIsPrintModalOpen(true)}
        onReportClick={() => setIsReportModalOpen(true)}
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
        title={editingRecord ? 'Editar EPI' : 'Novo EPI'}
      >
        <EpiForm
          initialData={editingRecord}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>

      <ConfirmModal
        isOpen={deleteData.isOpen}
        onClose={() => setDeleteData({ isOpen: false, record: null })}
        onConfirm={confirmDelete}
        title="Excluir Registro de EPI"
        message={`Tem certeza que deseja excluir o registro do EPI ${deleteData.record?.epi}? Esta ação não pode ser desfeita.`}
      />

      <FichaEpiModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        episData={data}
        funcionariosData={funcionariosUnicos}
      />

      <RelatorioEpiModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        episData={data}
        funcionariosData={funcionariosUnicos}
      />
    </div>
  );
}
