import { useState, useMemo, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { formatDate } from '@/lib/formatters';

export function FichaEpiModal({ isOpen, onClose, episData, funcionariosData, funcionarioPreSelecionado }) {
  const [selectedFuncionarioId, setSelectedFuncionarioId] = useState('');
  const [selectedEpis, setSelectedEpis] = useState([]);

  const funcionariosOptions = useMemo(() => {
    return funcionariosData.map(f => ({
      value: f.id,
      label: f.pessoas ? `${f.pessoas.nome} - ${f.cargo || 'S/ Cargo'}` : 'Sem Nome'
    }));
  }, [funcionariosData]);

  useEffect(() => {
    if (isOpen) {
      if (funcionarioPreSelecionado) {
        setSelectedFuncionarioId(funcionarioPreSelecionado.id);
      } else {
        setSelectedFuncionarioId('');
      }
      setSelectedEpis([]);
    }
  }, [isOpen, funcionarioPreSelecionado]);

  const episDoFuncionario = useMemo(() => {
    if (!selectedFuncionarioId) return [];
    return episData.filter(epi => epi.funcionario_id === selectedFuncionarioId);
  }, [episData, selectedFuncionarioId]);

  const funcionarioAtivo = useMemo(() => {
    return funcionariosData.find(f => f.id === selectedFuncionarioId);
  }, [funcionariosData, selectedFuncionarioId]);

  const handleToggleEpi = (epiId) => {
    setSelectedEpis(prev => 
      prev.includes(epiId) ? prev.filter(id => id !== epiId) : [...prev, epiId]
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const episParaImprimir = episDoFuncionario.filter(epi => selectedEpis.includes(epi.id));

  return (
    <>
      {/* Modal de Seleção (Oculto na Impressão) */}
      <div className="print:hidden">
        <Modal isOpen={isOpen} onClose={onClose} title="Imprimir Ficha de EPI">
          <div className="space-y-6">
            {!funcionarioPreSelecionado && (
              <div>
                <label className="block text-sm font-medium mb-1">Selecione o Funcionário</label>
                <SearchableSelect
                  options={funcionariosOptions}
                  value={selectedFuncionarioId}
                  onChange={(val) => {
                    setSelectedFuncionarioId(val);
                    setSelectedEpis([]);
                  }}
                  placeholder="Buscar funcionário..."
                />
              </div>
            )}

            {selectedFuncionarioId && (
              <div>
                <label className="block text-sm font-medium mb-2">Selecione os EPIs para a ficha</label>
                {episDoFuncionario.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum EPI encontrado para este funcionário.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded-md">
                    {episDoFuncionario.map(epi => (
                      <label key={epi.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          checked={selectedEpis.includes(epi.id)}
                          onChange={() => handleToggleEpi(epi.id)}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{epi.epi}</span>
                          <span className="text-xs text-gray-500">
                            Entregue: {formatDate(epi.data_entrega)} {epi.ca ? `| CA: ${epi.ca}` : ''}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handlePrint}
                disabled={selectedEpis.length === 0}
                className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Gerar Ficha
              </button>
            </div>
          </div>
        </Modal>
      </div>

      {/* Visão de Impressão (Visível apenas na Impressão) */}
      <div className="hidden print:block fixed inset-0 z-[9999] bg-white text-black p-8">
        {funcionarioAtivo && episParaImprimir.length > 0 && (
          <div className="w-full max-w-4xl mx-auto space-y-8">
            <div className="text-center border-b-2 border-black pb-4">
              <h1 className="text-2xl font-bold uppercase">Ficha de Controle de EPI</h1>
              <p className="text-sm">Equipamento de Proteção Individual</p>
            </div>

            <div className="grid grid-cols-2 gap-4 border border-black p-4 text-sm">
              <div className="col-span-2"><strong>Funcionário:</strong> {funcionarioAtivo.pessoas?.nome}</div>
              <div><strong>CPF:</strong> {funcionarioAtivo.pessoas?.cpf || 'Não informado'}</div>
              <div><strong>Cargo/Função:</strong> {funcionarioAtivo.cargo || '-'} / {funcionarioAtivo.funcao || '-'}</div>
            </div>

            <div className="text-sm mb-4">
              <p>Declaro para os devidos fins que recebi os Equipamentos de Proteção Individual abaixo descritos, comprometendo-me a utilizá-os apenas durante a jornada de trabalho, bem como zelar por sua conservação.</p>
            </div>

            <table className="w-full text-sm border-collapse border border-black">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-2 text-left">Data Entrega</th>
                  <th className="border border-black p-2 text-left">Descrição do EPI</th>
                  <th className="border border-black p-2 text-left">C.A.</th>
                  <th className="border border-black p-2 text-left">Observação</th>
                  <th className="border border-black p-2 text-center w-32">Assinatura Funcionário</th>
                </tr>
              </thead>
              <tbody>
                {episParaImprimir.map(epi => (
                  <tr key={epi.id}>
                    <td className="border border-black p-2">{formatDate(epi.data_entrega)}</td>
                    <td className="border border-black p-2">{epi.epi}</td>
                    <td className="border border-black p-2">{epi.ca || '-'}</td>
                    <td className="border border-black p-2">{epi.observacao || '-'}</td>
                    <td className="border border-black p-2 h-12"></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pt-24 grid grid-cols-2 gap-8">
              <div className="text-center">
                <div className="border-t border-black pt-2">
                  <strong>Assinatura do Funcionário</strong>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t border-black pt-2">
                  <strong>Assinatura do Responsável</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
