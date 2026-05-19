import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';
import { funcionariosService } from '@/services/funcionariosService';

export default function PrevisaoRhModal({ isOpen, onClose, onConfirmado }) {
  const [ano, setAno] = useState('');
  const [mes, setMes] = useState('');
  const [vencimentoSalario, setVencimentoSalario] = useState('');
  const [vencimentoVr, setVencimentoVr] = useState('');
  const [vencimentoVt, setVencimentoVt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const hoje = new Date();
      const y = hoje.getFullYear();
      const m = hoje.getMonth() + 1; // 1-12
      const ultimoDia = new Date(y, m, 0).getDate();
      
      const fmt = (d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      setAno(String(y));
      setMes(String(m));
      setVencimentoSalario(fmt(ultimoDia));
      setVencimentoVr(fmt(20));
      setVencimentoVt(fmt(20));
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ano || !mes || !vencimentoSalario || !vencimentoVr || !vencimentoVt) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await funcionariosService.gerarPrevisoesFinanceiras({
        ano: Number(ano),
        mes: Number(mes),
        vencimentoSalario,
        vencimentoVr,
        vencimentoVt
      });

      toast.success(`Previsões geradas: ${res.criadas} criada(s), ${res.ignoradas} ignorada(s). Total: R$ ${res.totalCriado.toFixed(2)}`);
      onConfirmado();
      onClose();
    } catch (error) {
      console.error('ERRO AO GERAR PREVISÕES RH:', error);
      toast.error(error.message || 'Erro ao gerar previsões financeiras de RH.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gerar Previsões Financeiras de RH" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Gere automaticamente contas a pagar (salário, VR e VT) para todos os funcionários ativos com valores configurados.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Ano *</label>
            <input
              type="number"
              placeholder="Ex: 2026"
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mês *</label>
            <select
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className={inputClass}
              required
            >
              <option value="">Selecione...</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {String(m).padStart(2, '0')} - {new Date(2000, m - 1, 1).toLocaleString('pt-BR', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Vencimento do Salário *</label>
            <input
              type="date"
              value={vencimentoSalario}
              onChange={(e) => setVencimentoSalario(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Vencimento VR *</label>
            <input
              type="date"
              value={vencimentoVr}
              onChange={(e) => setVencimentoVr(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Vencimento VT *</label>
            <input
              type="date"
              value={vencimentoVt}
              onChange={(e) => setVencimentoVt(e.target.value)}
              className={inputClass}
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-300 dark:border-zinc-700 text-sm hover:bg-gray-100 dark:hover:bg-zinc-800"
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
            disabled={submitting}
          >
            {submitting ? 'Gerando...' : 'Gerar Previsões'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
