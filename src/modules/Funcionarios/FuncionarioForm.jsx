import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import { pessoasService } from '@/services/pessoasService';
import SearchableSelect from '@/components/ui/SearchableSelect';
import CurrencyInput from '@/components/ui/CurrencyInput';

const funcionarioSchema = z.object({
  pessoa_id: z.string().uuid('Pessoa vinculada é obrigatória'),
  cargo: z.string().min(2, 'Cargo deve ter no mínimo 2 caracteres'),
  funcao: z.string().min(2, 'Função deve ter no mínimo 2 caracteres'),
  salario: z.number().min(0, 'Salário inválido').nullable().optional(),
  periodicidade_pagamento: z.string().optional(),
  vale_refeicao_valor: z.number().nullable().optional(),
  periodicidade_vr: z.string().optional(),
  vale_transporte_valor: z.number().nullable().optional(),
  periodicidade_vt: z.string().optional(),
  ativo: z.boolean().default(true),
});

const PERIODICIDADES = [
  { value: 'diário', label: 'Diário' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'quinzenal', label: 'Quinzenal' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'por medição', label: 'Por medição' },
  { value: 'por etapa', label: 'Por etapa' },
  { value: 'ao término', label: 'Ao término' },
  { value: 'outro', label: 'Outro' },
];

export default function FuncionarioForm({ initialData, onSubmit, onCancel }) {
  const [pessoasOptions, setPessoasOptions] = useState([]);
  
  const { register, handleSubmit, control, formState: { errors }, reset } = useForm({
    resolver: zodResolver(funcionarioSchema),
    defaultValues: {
      ativo: true,
      salario: null,
      vale_refeicao_valor: null,
      vale_transporte_valor: null,
      periodicidade_pagamento: '',
      periodicidade_vr: '',
      periodicidade_vt: '',
    }
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
    
    const loadDependencies = async () => {
      try {
        const pData = await pessoasService.getAll();
        setPessoasOptions(pData.map(p => ({ value: p.id, label: p.nome })));
      } catch (err) {
        console.error("Erro ao carregar pessoas para o select", err);
      }
    };
    loadDependencies();
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Pessoa Vinculada *</label>
          <Controller
            name="pessoa_id"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                options={pessoasOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="Selecione a pessoa..."
                error={!!errors.pessoa_id}
              />
            )}
          />
          {errors.pessoa_id && <span className="text-red-500 text-xs">{errors.pessoa_id.message}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Cargo *</label>
          <input
            {...register('cargo')}
            className={`w-full rounded-md border bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${errors.cargo ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
            placeholder="Ex: Engenheiro"
          />
          {errors.cargo && <span className="text-red-500 text-xs">{errors.cargo.message}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Função *</label>
          <input
            {...register('funcao')}
            className={`w-full rounded-md border bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${errors.funcao ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
            placeholder="Ex: Residente"
          />
          {errors.funcao && <span className="text-red-500 text-xs">{errors.funcao.message}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Salário Bruto</label>
          <Controller
            name="salario"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                value={field.value}
                onChange={field.onChange}
                error={!!errors.salario}
              />
            )}
          />
          {errors.salario && <span className="text-red-500 text-xs">{errors.salario.message}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Periodicidade do Pagamento</label>
          <select
            {...register('periodicidade_pagamento')}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Selecione...</option>
            {PERIODICIDADES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div className="p-3 border border-gray-200 dark:border-zinc-800 rounded-md bg-gray-50/50 dark:bg-zinc-800/20 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Vale-Refeição</h3>
          <div>
            <label className="block text-xs font-medium mb-1">Valor (R$)</label>
            <Controller
              name="vale_refeicao_valor"
              control={control}
              render={({ field }) => (
                <CurrencyInput value={field.value} onChange={field.onChange} />
              )}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Periodicidade</label>
            <select
              {...register('periodicidade_vr')}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Selecione...</option>
              {PERIODICIDADES.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-3 border border-gray-200 dark:border-zinc-800 rounded-md bg-gray-50/50 dark:bg-zinc-800/20 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Vale-Transporte</h3>
          <div>
            <label className="block text-xs font-medium mb-1">Valor (R$)</label>
            <Controller
              name="vale_transporte_valor"
              control={control}
              render={({ field }) => (
                <CurrencyInput value={field.value} onChange={field.onChange} />
              )}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Periodicidade</label>
            <select
              {...register('periodicidade_vt')}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Selecione...</option>
              {PERIODICIDADES.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="col-span-2 flex items-center mt-2">
          <input
            type="checkbox"
            id="ativo"
            {...register('ativo')}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="ativo" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
            Funcionário Ativo
          </label>
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
