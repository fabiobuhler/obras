import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect } from 'react';
import AsyncSearchableSelect from '@/components/ui/AsyncSearchableSelect';

const movimentacaoSchema = z.object({
  tipo_movimentacao: z.enum(['entrada', 'saída', 'transferência', 'devolução']),
  obra_origem_id: z.string().uuid().optional().nullable(),
  obra_destino_id: z.string().uuid().optional().nullable(),
  responsavel_id: z.string().uuid().optional().nullable(),
  data_movimentacao: z.string().min(1, 'Data é obrigatória'),
  observacao: z.string().optional()
});

export default function MovimentacaoForm({ initialData, equipamentoId, onSubmit, onCancel }) {
  const { register, handleSubmit, formState: { errors }, reset, control } = useForm({
    resolver: zodResolver(movimentacaoSchema),
    defaultValues: initialData || { tipo_movimentacao: 'transferência' }
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const handleFormSubmit = (data) => {
    const payload = {
      ...data,
      equipamento_id: equipamentoId,
      obra_origem_id: data.obra_origem_id || null,
      obra_destino_id: data.obra_destino_id || null,
      responsavel_id: data.responsavel_id || null,
      observacao: data.observacao || null
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Data da Movimentação *</label>
          <input type="date" {...register('data_movimentacao')} className={`w-full rounded-md border bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${errors.data_movimentacao ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`} />
          {errors.data_movimentacao && <span className="text-red-500 text-xs">{errors.data_movimentacao.message}</span>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tipo de Movimentação *</label>
          <select {...register('tipo_movimentacao')} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm">
            <option value="entrada">Entrada</option>
            <option value="saída">Saída</option>
            <option value="transferência">Transferência</option>
            <option value="devolução">Devolução</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Obra de Origem</label>
          <AsyncSearchableSelect control={control} name="obra_origem_id" table="obras" labelField="nome_obra" placeholder="Buscar obra de origem..." />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Obra de Destino</label>
          <AsyncSearchableSelect control={control} name="obra_destino_id" table="obras" labelField="nome_obra" placeholder="Buscar obra de destino..." />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Responsável pela Movimentação</label>
          <AsyncSearchableSelect control={control} name="responsavel_id" table="pessoas" labelField="nome" placeholder="Buscar responsável..." />
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
