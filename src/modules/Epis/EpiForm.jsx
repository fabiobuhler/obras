import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import { funcionariosService } from '@/services/funcionariosService';
import SearchableSelect from '@/components/ui/SearchableSelect';

const epiSchema = z.object({
  funcionario_id: z.string().uuid('Funcionário vinculado é obrigatório'),
  epi: z.string().min(2, 'Descrição do EPI deve ter no mínimo 2 caracteres'),
  ca: z.string().optional(),
  data_entrega: z.string().optional(),
  data_baixa: z.string().optional(),
  status: z.string().min(1, 'Status é obrigatório'),
  observacao: z.string().optional(),
});

const STATUS_OPCOES = [
  { value: 'Em uso', label: 'Em uso' },
  { value: 'Baixado', label: 'Baixado' },
  { value: 'Vencido', label: 'Vencido' },
];

export default function EpiForm({ initialData, onSubmit, onCancel }) {
  const [funcionariosOptions, setFuncionariosOptions] = useState([]);
  
  const { register, handleSubmit, control, formState: { errors }, reset } = useForm({
    resolver: zodResolver(epiSchema),
    defaultValues: {
      status: 'Em uso',
    }
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
    
    const loadDependencies = async () => {
      try {
        const fData = await funcionariosService.getAll();
        setFuncionariosOptions(fData.map(f => ({ 
          value: f.id, 
          label: f.pessoas ? `${f.pessoas.nome} - ${f.cargo || 'S/ Cargo'}` : 'Sem Nome'
        })));
      } catch (err) {
        console.error("Erro ao carregar funcionários para o select", err);
      }
    };
    loadDependencies();
  }, [initialData, reset]);

  const handleFormSubmit = (data) => {
    const payload = {
      ...data,
      data_entrega: data.data_entrega || null,
      data_baixa: data.data_baixa || null,
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Funcionário *</label>
          <Controller
            name="funcionario_id"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                options={funcionariosOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="Selecione o funcionário..."
                error={!!errors.funcionario_id}
              />
            )}
          />
          {errors.funcionario_id && <span className="text-red-500 text-xs">{errors.funcionario_id.message}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">EPI (Descrição) *</label>
          <input
            {...register('epi')}
            className={`w-full rounded-md border bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${errors.epi ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
            placeholder="Ex: Capacete, Bota, Luva"
          />
          {errors.epi && <span className="text-red-500 text-xs">{errors.epi.message}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">C.A. (Certificado de Aprovação)</label>
          <input
            {...register('ca')}
            className={`w-full rounded-md border bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary border-gray-300 dark:border-gray-700`}
            placeholder="Ex: 12345"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Data de Entrega</label>
          <input
            type="date"
            {...register('data_entrega')}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Data de Baixa/Devolução</label>
          <input
            type="date"
            {...register('data_baixa')}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Status *</label>
          <select
            {...register('status')}
            className={`w-full rounded-md border bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${errors.status ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
          >
            <option value="">Selecione...</option>
            {STATUS_OPCOES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          {errors.status && <span className="text-red-500 text-xs">{errors.status.message}</span>}
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Observação</label>
          <textarea
            {...register('observacao')}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
            placeholder="Informações adicionais..."
          ></textarea>
        </div>

      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-zinc-800 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent hover:bg-gray-100 dark:hover:bg-zinc-800 text-sm font-medium transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium transition-colors"
        >
          Salvar
        </button>
      </div>
    </form>
  );
}
