import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import CurrencyInput from '@/components/ui/CurrencyInput';
import { storageService } from '@/services/storageService';
import { toast } from 'sonner';

const pagamentoSchema = z.object({
  valor_pago:      z.number({ required_error: 'Valor obrigatório' }).positive('Valor deve ser positivo'),
  data_pagamento:  z.string().min(1, 'Data obrigatória'),
  forma_pagamento: z.string().optional().nullable(),
  observacoes:     z.string().optional().nullable(),
  comprovante_url: z.string().optional().nullable(),
  novo_vencimento: z.string().optional().nullable(),
});

const FORMAS = ['PIX', 'Transferência', 'Boleto', 'À Vista', 'Cheque', 'Cartão', 'Outro'];

export default function PagamentoModal({ isOpen, onClose, conta, onPagamentoRegistrado }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const totalConta = conta ? Number(conta.valor_total ?? conta.valor ?? 0) : 0;
  const valorJaPago = conta ? Number(conta.valor_pago || 0) : 0;
  const saldoRestante = Math.max(0, totalConta - valorJaPago);

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm({
    resolver: zodResolver(pagamentoSchema),
    defaultValues: {
      data_pagamento: new Date().toISOString().split('T')[0],
      valor_pago: conta ? totalConta - valorJaPago : 0,
    },
  });

  const valorPagoDigitado = watch('valor_pago');
  const isParcial = valorPagoDigitado !== undefined && Number(valorPagoDigitado) < saldoRestante;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Máximo 10MB.'); return; }
    setSelectedFile(file);
  };

  const onSubmit = async (data) => {
    const valorPagamento = Number(data.valor_pago || 0);

    if (valorPagamento > saldoRestante) {
      toast.error('O valor do pagamento não pode ser maior que o saldo restante.');
      return;
    }

    if (saldoRestante <= 0) {
      toast.error('Esta conta não possui saldo em aberto.');
      return;
    }

    try {
      setUploading(true);
      let comprovanteUrl = data.comprovante_url || null;

      if (selectedFile) {
        comprovanteUrl = await storageService.uploadFinanceiroArquivo(selectedFile, conta.id, 'comprovantes');
      }

      const payload = {
        valor_pago:      data.valor_pago,
        data_pagamento:  data.data_pagamento,
        forma_pagamento: data.forma_pagamento || null,
        observacoes:     data.observacoes || null,
      };

      if (comprovanteUrl) {
        payload.comprovante_url = comprovanteUrl;
      }

      if (isParcial && data.novo_vencimento) {
        payload.novo_vencimento = data.novo_vencimento;
      }

      await onPagamentoRegistrado(conta.id, payload);
      reset();
      setSelectedFile(null);
      onClose();
    } catch (error) {
      console.error('ERRO AO REGISTRAR PAGAMENTO:', error);
      toast.error(error.message || 'Erro ao registrar pagamento.');
    } finally {
      setUploading(false);
    }
  };


  const inputClass = "w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Pagamento" size="md">
      {conta && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-3 mb-4 text-sm">
          <p className="font-semibold text-blue-800 dark:text-blue-200">{conta.descricao}</p>
          <div className="flex gap-6 mt-1 text-blue-700 dark:text-blue-300 text-xs">
            <span>Total: <strong>R$ {Number(conta.valor_total).toFixed(2)}</strong></span>
            <span>Já pago: <strong>R$ {Number(conta.valor_pago || 0).toFixed(2)}</strong></span>
            <span>Saldo: <strong>R$ {saldoRestante.toFixed(2)}</strong></span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Valor do Pagamento *</label>
            <CurrencyInput
              onValueChange={(val) => setValue('valor_pago', val)}
              defaultValue={saldoRestante > 0 ? saldoRestante : undefined}
            />
            {errors.valor_pago && <span className="text-red-500 text-xs">{errors.valor_pago.message}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Data do Pagamento *</label>
            <input type="date" {...register('data_pagamento')} className={inputClass} />
            {errors.data_pagamento && <span className="text-red-500 text-xs">{errors.data_pagamento.message}</span>}
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Forma de Pagamento</label>
            <select {...register('forma_pagamento')} className={inputClass}>
              <option value="">Selecione...</option>
              {FORMAS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Observação</label>
            <textarea {...register('observacoes')} rows={2} className={inputClass} placeholder="Detalhes do pagamento..." />
          </div>

          {isParcial && (
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-orange-600 dark:text-orange-400">
                Nova previsão de quitação / novo vencimento
              </label>
              <input type="date" {...register('novo_vencimento')} className={inputClass} />
              {errors.novo_vencimento && <span className="text-red-500 text-xs">{errors.novo_vencimento.message}</span>}
              <p className="text-xs text-muted-foreground mt-1">Defina um novo vencimento para o saldo restante.</p>
            </div>
          )}
        </div>

        {/* Upload comprovante */}
        <div>
          <label className="block text-sm font-medium mb-2">Comprovante</label>
          <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-zinc-800/30 relative min-h-[80px]">
            {selectedFile ? (
              <div className="flex items-center justify-between w-full p-2 bg-white dark:bg-zinc-900 rounded border">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileIcon size={16} className="text-blue-500 shrink-0" />
                  <span className="text-sm truncate">{selectedFile.name}</span>
                </div>
                <button type="button" onClick={() => setSelectedFile(null)}><X size={14} className="text-gray-400 hover:text-red-500" /></button>
              </div>
            ) : (
              <>
                <UploadCloud size={24} className="text-gray-400 mb-1" />
                <p className="text-xs text-gray-500">Clique para anexar comprovante</p>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-zinc-800">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border border-gray-300 dark:border-zinc-700 text-sm hover:bg-gray-100 dark:hover:bg-zinc-800">Cancelar</button>
          <button type="submit" disabled={uploading} className="px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            {uploading ? 'Registrando...' : 'Confirmar Pagamento'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
