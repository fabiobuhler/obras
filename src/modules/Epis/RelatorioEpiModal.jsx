import { useState, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { formatDate } from '@/lib/formatters';

export function RelatorioEpiModal({ isOpen, onClose, episData, funcionariosData }) {
  const [filtroFuncionario, setFiltroFuncionario] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  const funcionariosOptions = useMemo(() => {
    return [
      { value: '', label: 'Todos os Funcionários' },
      ...funcionariosData.map(f => ({
        value: f.id,
        label: f.pessoas ? `${f.pessoas.nome} - ${f.cargo || 'S/ Cargo'}` : 'Sem Nome'
      }))
    ];
  }, [funcionariosData]);

  const STATUS_OPCOES = [
    { value: '', label: 'Todos os Status' },
    { value: 'Em uso', label: 'Em uso' },
    { value: 'Baixado', label: 'Baixado' },
    { value: 'Vencido', label: 'Vencido' },
  ];

  const episFiltrados = useMemo(() => {
    return episData.filter(epi => {
      let match = true;
      if (filtroFuncionario && epi.funcionario_id !== filtroFuncionario) match = false;
      if (filtroStatus && epi.status !== filtroStatus) match = false;
      if (filtroDataInicio && (!epi.data_entrega || new Date(epi.data_entrega) < new Date(filtroDataInicio))) match = false;
      if (filtroDataFim && (!epi.data_entrega || new Date(epi.data_entrega) > new Date(filtroDataFim))) match = false;
      return match;
    });
  }, [episData, filtroFuncionario, filtroStatus, filtroDataInicio, filtroDataFim]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="print:hidden">
        <Modal isOpen={isOpen} onClose={onClose} title="Relatório de EPIs">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Funcionário</label>
                <SearchableSelect
                  options={funcionariosOptions}
                  value={filtroFuncionario}
                  onChange={setFiltroFuncionario}
                  placeholder="Todos os funcionários"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {STATUS_OPCOES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Data Início</label>
                  <input
                    type="date"
                    value={filtroDataInicio}
                    onChange={(e) => setFiltroDataInicio(e.target.value)}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Data Fim</label>
                  <input
                    type="date"
                    value={filtroDataFim}
                    onChange={(e) => setFiltroDataFim(e.target.value)}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 border border-gray-200 dark:border-gray-800 rounded-md bg-gray-50 dark:bg-zinc-800/20 max-h-60 overflow-y-auto">
              <p className="text-sm font-semibold mb-2">Resumo ({episFiltrados.length} registros)</p>
              {episFiltrados.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum EPI encontrado com os filtros atuais.</p>
              ) : (
                <ul className="space-y-1">
                  {episFiltrados.map(epi => (
                    <li key={epi.id} className="text-sm border-b border-gray-200 dark:border-gray-700 pb-1">
                      <strong>{epi.funcionarios?.pessoas?.nome || 'N/A'}:</strong> {epi.epi} - <span className="text-gray-500">{epi.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Fechar
              </button>
              <button
                onClick={handlePrint}
                disabled={episFiltrados.length === 0}
                className="px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Imprimir Relatório
              </button>
            </div>
          </div>
        </Modal>
      </div>

      {/* View de Impressão */}
      <div className="hidden print:block fixed inset-0 z-[9999] bg-white text-black p-8">
        <div className="w-full max-w-5xl mx-auto space-y-6">
          <div className="text-center border-b-2 border-black pb-4">
            <h1 className="text-2xl font-bold uppercase">Relatório de EPIs</h1>
            <p className="text-sm">Controle de Equipamentos de Proteção Individual</p>
          </div>

          <div className="text-sm flex justify-between">
            <p><strong>Filtros aplicados:</strong></p>
            <p><strong>Data de emissão:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          <ul className="text-sm list-disc list-inside">
            <li>Funcionário: {filtroFuncionario ? funcionariosOptions.find(f => f.value === filtroFuncionario)?.label : 'Todos'}</li>
            <li>Status: {filtroStatus || 'Todos'}</li>
            <li>Período: {filtroDataInicio ? formatDate(filtroDataInicio) : 'Qualquer'} a {filtroDataFim ? formatDate(filtroDataFim) : 'Qualquer'}</li>
          </ul>

          <table className="w-full text-sm border-collapse border border-black mt-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2 text-left">Funcionário</th>
                <th className="border border-black p-2 text-left">EPI</th>
                <th className="border border-black p-2 text-left">C.A.</th>
                <th className="border border-black p-2 text-center">Entrega</th>
                <th className="border border-black p-2 text-center">Status</th>
                <th className="border border-black p-2 text-left">Observação</th>
              </tr>
            </thead>
            <tbody>
              {episFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="border border-black p-4 text-center">Nenhum registro encontrado.</td>
                </tr>
              ) : (
                episFiltrados.map(epi => (
                  <tr key={epi.id}>
                    <td className="border border-black p-2">{epi.funcionarios?.pessoas?.nome || 'N/A'}</td>
                    <td className="border border-black p-2">{epi.epi}</td>
                    <td className="border border-black p-2">{epi.ca || '-'}</td>
                    <td className="border border-black p-2 text-center">{formatDate(epi.data_entrega) || '-'}</td>
                    <td className="border border-black p-2 text-center">{epi.status}</td>
                    <td className="border border-black p-2">{epi.observacao || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
