import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Card, CardContent } from '@/components/ui/Card';
import { ButtonNovo, ButtonImprimir } from '@/components/ui/ActionButtons';
import DataTable from '@/shared/DataTable';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { episService } from '@/services/episService';
import { documentosService } from '@/services/documentosService';
import { nrsService } from '@/services/nrsService';
import { examesService } from '@/services/examesService';
import EpiForm from '@/modules/Epis/EpiForm';
import DocumentoForm from './DocumentoForm';
import NrForm from './NrForm';
import ExameForm from './ExameForm';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { FichaEpiModal } from '@/modules/Epis/FichaEpiModal';
import { toast } from 'sonner';

export function FuncionarioDetalhes({ isOpen, onClose, funcionario }) {
  const [activeTab, setActiveTab] = useState('gerais');
  
  // Estados para EPIs
  const [epis, setEpis] = useState([]);
  const [loadingEpis, setLoadingEpis] = useState(false);
  const [isEpiModalOpen, setIsEpiModalOpen] = useState(false);
  const [editingEpi, setEditingEpi] = useState(null);
  const [deleteEpiData, setDeleteEpiData] = useState({ isOpen: false, record: null });
  const [isPrintEpiModalOpen, setIsPrintEpiModalOpen] = useState(false);

  // Estados para Documentos
  const [documentos, setDocumentos] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [deleteDocData, setDeleteDocData] = useState({ isOpen: false, record: null });

  // Estados para NRs
  const [nrs, setNrs] = useState([]);
  const [loadingNrs, setLoadingNrs] = useState(false);
  const [isNrModalOpen, setIsNrModalOpen] = useState(false);
  const [editingNr, setEditingNr] = useState(null);
  const [deleteNrData, setDeleteNrData] = useState({ isOpen: false, record: null });

  // Estados para Exames
  const [exames, setExames] = useState([]);
  const [loadingExames, setLoadingExames] = useState(false);
  const [isExameModalOpen, setIsExameModalOpen] = useState(false);
  const [editingExame, setEditingExame] = useState(null);
  const [deleteExameData, setDeleteExameData] = useState({ isOpen: false, record: null });

  useEffect(() => {
    if (isOpen && funcionario) {
      setActiveTab('gerais');
      loadAllData();
    }
  }, [isOpen, funcionario]);

  const loadAllData = () => {
    loadEpis();
    loadDocs();
    loadNrs();
    loadExames();
  };

  // --- EPIs ---
  const loadEpis = async () => {
    try {
      setLoadingEpis(true);
      const data = await episService.getAll();
      setEpis(data.filter(e => e.funcionario_id === funcionario?.id));
    } catch (error) { toast.error('Erro ao carregar EPIs'); } 
    finally { setLoadingEpis(false); }
  };
  const handleEpiSubmit = async (formData) => {
    try {
      if (editingEpi?.id) {
        await episService.update(editingEpi.id, formData);
      } else {
        await episService.create(formData);
      }
      toast.success('EPI salvo');
      setIsEpiModalOpen(false); setEditingEpi(null);
      loadEpis();
    } catch (error) { toast.error('Erro ao salvar EPI'); }
  };
  const confirmDeleteEpi = async () => {
    try {
      await episService.delete(deleteEpiData.record.id);
      toast.success('EPI excluído');
      setDeleteEpiData({ isOpen: false, record: null });
      loadEpis();
    } catch (error) { toast.error('Erro ao excluir EPI'); }
  };

  // --- Documentos ---
  const loadDocs = async () => {
    try {
      setLoadingDocs(true);
      setDocumentos(await documentosService.getByFuncionario(funcionario?.id));
    } catch (error) { toast.error('Erro ao carregar Documentos'); } 
    finally { setLoadingDocs(false); }
  };
  const handleDocSubmit = async (formData) => {
    try {
      const cleanData = { ...formData };
      delete cleanData.id; // Evitar enviar ID no body do PATCH ou POST

      if (editingDoc?.id) {
        await documentosService.update(editingDoc.id, cleanData);
      } else {
        await documentosService.create(cleanData);
      }
      toast.success('Documento salvo');
      setIsDocModalOpen(false); setEditingDoc(null);
      loadDocs();
    } catch (error) { toast.error('Erro ao salvar Documento'); }
  };
  const confirmDeleteDoc = async () => {
    try {
      await documentosService.delete(deleteDocData.record.id);
      toast.success('Documento excluído');
      setDeleteDocData({ isOpen: false, record: null });
      loadDocs();
    } catch (error) { toast.error('Erro ao excluir Documento'); }
  };

  // --- NRs ---
  const loadNrs = async () => {
    try {
      setLoadingNrs(true);
      setNrs(await nrsService.getByFuncionario(funcionario?.id));
    } catch (error) { toast.error('Erro ao carregar NRs'); } 
    finally { setLoadingNrs(false); }
  };
  const handleNrSubmit = async (formData) => {
    try {
      const cleanData = { ...formData };
      delete cleanData.id;

      if (editingNr?.id) {
        await nrsService.update(editingNr.id, cleanData);
      } else {
        await nrsService.create(cleanData);
      }
      toast.success('NR salva');
      setIsNrModalOpen(false); setEditingNr(null);
      loadNrs();
    } catch (error) { toast.error('Erro ao salvar NR'); }
  };
  const confirmDeleteNr = async () => {
    try {
      await nrsService.delete(deleteNrData.record.id);
      toast.success('NR excluída');
      setDeleteNrData({ isOpen: false, record: null });
      loadNrs();
    } catch (error) { toast.error('Erro ao excluir NR'); }
  };

  // --- Exames ---
  const loadExames = async () => {
    try {
      setLoadingExames(true);
      setExames(await examesService.getByFuncionario(funcionario?.id));
    } catch (error) { toast.error('Erro ao carregar Exames'); } 
    finally { setLoadingExames(false); }
  };
  const handleExameSubmit = async (formData) => {
    try {
      const cleanData = { ...formData };
      delete cleanData.id;

      if (editingExame?.id) {
        await examesService.update(editingExame.id, cleanData);
      } else {
        await examesService.create(cleanData);
      }
      toast.success('Exame salvo');
      setIsExameModalOpen(false); setEditingExame(null);
      loadExames();
    } catch (error) { toast.error('Erro ao salvar Exame'); }
  };
  const confirmDeleteExame = async () => {
    try {
      await examesService.delete(deleteExameData.record.id);
      toast.success('Exame excluído');
      setDeleteExameData({ isOpen: false, record: null });
      loadExames();
    } catch (error) { toast.error('Erro ao excluir Exame'); }
  };

  if (!funcionario) return null;

  const renderBadge = (status) => {
    if (!status) return '-';
    let color = 'bg-gray-100 text-gray-700';
    if (status === 'Válido' || status === 'Apto') color = 'bg-green-100 text-green-700';
    if (status === 'Vencido' || status === 'Inapto') color = 'bg-red-100 text-red-700';
    if (status === 'A Vencer' || status === 'Restrição') color = 'bg-yellow-100 text-yellow-700';
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>{status}</span>;
  };

  const linkRenderer = (url) => {
    if (!url) return '-';
    return <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Ver Arquivo</a>;
  };

  const epiColumns = [
    { header: 'EPI', accessor: 'epi' },
    { header: 'C.A.', accessor: 'ca', render: (row) => row.ca || '-' },
    { header: 'Entrega', accessor: 'data_entrega', render: (row) => formatDate(row.data_entrega) || '-' },
    { header: 'Baixa', accessor: 'data_baixa', render: (row) => formatDate(row.data_baixa) || '-' },
    { header: 'Status', accessor: 'status', render: (row) => renderBadge(row.status) },
  ];

  const docColumns = [
    { header: 'Tipo', accessor: 'tipo_documento' },
    { header: 'Descrição', accessor: 'descricao', render: (row) => row.descricao || '-' },
    { header: 'Emissão', accessor: 'data_emissao', render: (row) => formatDate(row.data_emissao) || '-' },
    { header: 'Validade', accessor: 'validade', render: (row) => formatDate(row.validade) || '-' },
    { header: 'Arquivo', accessor: 'arquivo_url', render: (row) => linkRenderer(row.arquivo_url) },
  ];

  const nrColumns = [
    { header: 'NR', accessor: 'nr' },
    { header: 'Descrição', accessor: 'descricao', render: (row) => row.descricao || '-' },
    { header: 'Emissão', accessor: 'data_emissao', render: (row) => formatDate(row.data_emissao) || '-' },
    { header: 'Validade', accessor: 'validade', render: (row) => formatDate(row.validade) || '-' },
    { header: 'Status', accessor: 'status', render: (row) => renderBadge(row.status) },
    { header: 'Arquivo', accessor: 'arquivo_url', render: (row) => linkRenderer(row.arquivo_url) },
  ];

  const exameColumns = [
    { header: 'Tipo', accessor: 'tipo_exame' },
    { header: 'Data', accessor: 'data_exame', render: (row) => formatDate(row.data_exame) || '-' },
    { header: 'Validade', accessor: 'validade', render: (row) => formatDate(row.validade) || '-' },
    { header: 'Resultado', accessor: 'resultado', render: (row) => renderBadge(row.resultado) },
    { header: 'Arquivo', accessor: 'arquivo_url', render: (row) => linkRenderer(row.arquivo_url) },
  ];

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Detalhes do Funcionário: ${funcionario.pessoas?.nome || 'N/A'}`}>
        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-md grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs font-semibold">CPF</p>
              <p className="font-medium">{funcionario.pessoas?.cpf || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-semibold">Cargo</p>
              <p className="font-medium">{funcionario.cargo || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-semibold">Função</p>
              <p className="font-medium">{funcionario.funcao || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-semibold">Status</p>
              {renderBadge(funcionario.ativo ? 'Ativo' : 'Inativo')}
            </div>
          </div>

          <div className="border-b border-gray-200 dark:border-gray-700 flex space-x-4 overflow-x-auto">
            {[
              { id: 'gerais', label: 'Dados Gerais' },
              { id: 'epis', label: 'EPIs' },
              { id: 'docs', label: 'Documentos' },
              { id: 'nrs', label: 'NRs' },
              { id: 'exames', label: 'Exames' }
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
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 border-b pb-1 mb-2">Informações Financeiras</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <p className="text-gray-500">Salário Bruto:</p>
                      <p className="font-medium">{funcionario.salario ? formatCurrency(funcionario.salario) : '-'}</p>
                      <p className="text-gray-500">Forma Pagamento:</p>
                      <p className="font-medium capitalize">{funcionario.periodicidade_pagamento || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 border-b pb-1 mb-2">Benefícios</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <p className="text-gray-500">Vale-Refeição:</p>
                      <p className="font-medium">
                        {funcionario.vale_refeicao_valor ? formatCurrency(funcionario.vale_refeicao_valor) : '-'}
                        {funcionario.periodicidade_vr ? ` (${funcionario.periodicidade_vr})` : ''}
                      </p>
                      <p className="text-gray-500">Vale-Transporte:</p>
                      <p className="font-medium">
                        {funcionario.vale_transporte_valor ? formatCurrency(funcionario.vale_transporte_valor) : '-'}
                        {funcionario.periodicidade_vt ? ` (${funcionario.periodicidade_vt})` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'epis' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Equipamentos do Funcionário</h3>
                  <div className="flex gap-2">
                    <ButtonImprimir onClick={() => setIsPrintEpiModalOpen(true)}>Ficha EPI</ButtonImprimir>
                    <ButtonNovo onClick={() => { setEditingEpi({ funcionario_id: funcionario.id }); setIsEpiModalOpen(true); }}>Novo EPI</ButtonNovo>
                  </div>
                </div>
                <DataTable
                  columns={epiColumns}
                  data={epis}
                  isLoading={loadingEpis}
                  onEdit={(record) => { setEditingEpi(record); setIsEpiModalOpen(true); }}
                  onDelete={(record) => setDeleteEpiData({ isOpen: true, record })}
                />
              </div>
            )}

            {activeTab === 'docs' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Documentos</h3>
                  <ButtonNovo onClick={() => { setEditingDoc(null); setIsDocModalOpen(true); }}>Novo Documento</ButtonNovo>
                </div>
                <DataTable
                  columns={docColumns}
                  data={documentos}
                  isLoading={loadingDocs}
                  onEdit={(record) => { setEditingDoc(record); setIsDocModalOpen(true); }}
                  onDelete={(record) => setDeleteDocData({ isOpen: true, record })}
                />
              </div>
            )}

            {activeTab === 'nrs' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Normas Regulamentadoras (NRs)</h3>
                  <ButtonNovo onClick={() => { setEditingNr(null); setIsNrModalOpen(true); }}>Nova NR</ButtonNovo>
                </div>
                <DataTable
                  columns={nrColumns}
                  data={nrs}
                  isLoading={loadingNrs}
                  onEdit={(record) => { setEditingNr(record); setIsNrModalOpen(true); }}
                  onDelete={(record) => setDeleteNrData({ isOpen: true, record })}
                />
              </div>
            )}

            {activeTab === 'exames' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Exames Ocupacionais</h3>
                  <ButtonNovo onClick={() => { setEditingExame(null); setIsExameModalOpen(true); }}>Novo Exame</ButtonNovo>
                </div>
                <DataTable
                  columns={exameColumns}
                  data={exames}
                  isLoading={loadingExames}
                  onEdit={(record) => { setEditingExame(record); setIsExameModalOpen(true); }}
                  onDelete={(record) => setDeleteExameData({ isOpen: true, record })}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-zinc-800">
            <button onClick={onClose} className="px-4 py-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent hover:bg-gray-100 text-sm font-medium">
              Fechar Detalhes
            </button>
          </div>
        </div>
      </Modal>

      {/* EPIs Modals */}
      {isEpiModalOpen && (
        <Modal isOpen={isEpiModalOpen} onClose={() => setIsEpiModalOpen(false)} title={editingEpi?.id ? 'Editar EPI' : 'Novo EPI'}>
          <EpiForm initialData={editingEpi} onSubmit={handleEpiSubmit} onCancel={() => setIsEpiModalOpen(false)} />
        </Modal>
      )}
      {deleteEpiData.isOpen && (
        <ConfirmModal isOpen={deleteEpiData.isOpen} onClose={() => setDeleteEpiData({ isOpen: false, record: null })} onConfirm={confirmDeleteEpi} title="Excluir EPI" message="Confirma a exclusão deste EPI?" />
      )}
      {isPrintEpiModalOpen && (
        <FichaEpiModal isOpen={isPrintEpiModalOpen} onClose={() => setIsPrintEpiModalOpen(false)} episData={epis} funcionariosData={[funcionario]} funcionarioPreSelecionado={funcionario} />
      )}

      {/* Documentos Modals */}
      {isDocModalOpen && (
        <Modal isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} title={editingDoc?.id ? 'Editar Documento' : 'Novo Documento'}>
          <DocumentoForm initialData={editingDoc} funcionarioId={funcionario.id} onSubmit={handleDocSubmit} onCancel={() => setIsDocModalOpen(false)} />
        </Modal>
      )}
      {deleteDocData.isOpen && (
        <ConfirmModal isOpen={deleteDocData.isOpen} onClose={() => setDeleteDocData({ isOpen: false, record: null })} onConfirm={confirmDeleteDoc} title="Excluir Documento" message="Confirma a exclusão deste Documento?" />
      )}

      {/* NRs Modals */}
      {isNrModalOpen && (
        <Modal isOpen={isNrModalOpen} onClose={() => setIsNrModalOpen(false)} title={editingNr?.id ? 'Editar NR' : 'Nova NR'}>
          <NrForm initialData={editingNr} funcionarioId={funcionario.id} onSubmit={handleNrSubmit} onCancel={() => setIsNrModalOpen(false)} />
        </Modal>
      )}
      {deleteNrData.isOpen && (
        <ConfirmModal isOpen={deleteNrData.isOpen} onClose={() => setDeleteNrData({ isOpen: false, record: null })} onConfirm={confirmDeleteNr} title="Excluir NR" message="Confirma a exclusão desta NR?" />
      )}

      {/* Exames Modals */}
      {isExameModalOpen && (
        <Modal isOpen={isExameModalOpen} onClose={() => setIsExameModalOpen(false)} title={editingExame?.id ? 'Editar Exame' : 'Novo Exame'}>
          <ExameForm initialData={editingExame} funcionarioId={funcionario.id} onSubmit={handleExameSubmit} onCancel={() => setIsExameModalOpen(false)} />
        </Modal>
      )}
      {deleteExameData.isOpen && (
        <ConfirmModal isOpen={deleteExameData.isOpen} onClose={() => setDeleteExameData({ isOpen: false, record: null })} onConfirm={confirmDeleteExame} title="Excluir Exame" message="Confirma a exclusão deste Exame?" />
      )}
    </>
  );
}
