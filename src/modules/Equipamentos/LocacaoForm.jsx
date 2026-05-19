import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect } from 'react';
import AsyncSearchableSelect from '@/components/ui/AsyncSearchableSelect';
import CurrencyInput from '@/components/ui/CurrencyInput';

const locacaoSchema = z.object({
  fornecedor_id: z.string().uuid().optional().nullable(),
  obra_id: z.string().uuid().optional().nullable(),
  data_inicio: z.string().optional(),
  previsao_devolucao: z.string().optional(),
  data_devolucao: z.string().optional(),
  tipo_locacao: z.string().optional(),
  valor: z.number().optional().nullable(),
  forma_pagamento: z.string().optional(),
  status: z.enum(['ativa', 'encerrada', 'vencida']).default('ativa'),
  observacao: z.string().optional()
});

export default function LocacaoForm({ initialData, equipamentoId, onSubmit, onCancel }) {
  const { register, handleSubmit, formState: { errors }, reset, control, setValue } = useForm({
    resolver: zodResolver(locacaoSchema),
    defaultValues: initialData || { status: 'ativa' }
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const handleFormSubmit = (data) => {
    const payload = {
      ...data,
      equipamento_id: equipamentoId,
      fornecedor_id: data.fornecedor_id || null,
      obra_id: data.obra_id || null,
      data_inicio: data.data_inicio || null,
      previsao_devolucao: data.previsao_devolucao || null,
      data_devolucao: data.data_devolucao || null,
      valor: data.valor || null,
      observacao: data.observacao || null
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Fornecedor / Locador</label>
          <AsyncSearchableSelect control={control} name="fornecedor_id" table="empresas" labelField="nome_fantasia" placeholder="Buscar fornecedor..." />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Obra de Alocação</label>
          <AsyncSearchableSelect control={control} name="obra_id" table="obras" labelField="nome_obra" placeholder="Buscar obra..." />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Data Início</label>
          <input type="date" {...register('data_inicio')} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Previsão Devolução</label>
          <input type="date" {...register('previsao_devolucao')} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Data Devolução Efetiva</label>
          <input type="date" {...register('data_devolucao')} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tipo de Locação</label>
          <select {...register('tipo_locacao')} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm">
            <option value="">Selecione...</option>
            <option value="diária">Diária</option>
            <option value="semanal">Semanal</option>
            <option value="quinzenal">Quinzenal</option>
            <option value="mensal">Mensal</option>
            <option value="anual">Anual</option>
            <option value="por medição">Por Medição</option>
            <option value="outro">Outro</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Valor</label>
          <CurrencyInput
            name="valor"
            control={control}
            defaultValue={initialData?.valor}
            onValueChange={(val) => setValue('valor', val)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Forma de Pagamento</label>
          <input {...register('forma_pagamento')} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm" placeholder="Ex: Boleto 30 dias" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Status da Locação</label>
          <select {...register('status')} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm">
            <option value="ativa">Ativa</option>
            <option value="encerrada">Encerrada</option>
            <option value="vencida">Vencida</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Observação</label>
          <textarea {...register('observacao')} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm min-h-[60px]"></textarea>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-zinc-800 mt-6">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent hover:bg-gray-100 dark:hover:bg-zinc-800 text-sm font-medium transition-colors">Cancelar</button>
        <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium transition-colors">Salvar</button>
      </div>
    </form>
  );
}
