import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import { pessoasService } from '@/services/pessoasService';
import { formatCNPJ } from '@/lib/formatters';

const empresaSchema = z.object({
  razao_social: z.string().min(3, 'Razão Social deve ter no mínimo 3 caracteres'),
  nome_fantasia: z.string().optional(),
  cnpj: z.string().min(14, 'CNPJ é obrigatório'),
  endereco: z.string().optional(),
  contato_principal_id: z.string().uuid().optional().nullable(),
});

export default function EmpresaForm({ initialData, onSubmit, onCancel }) {
  const [pessoas, setPessoas] = useState([]);
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    resolver: zodResolver(empresaSchema),
    defaultValues: initialData || {}
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
    const loadPessoas = async () => {
      try {
        const data = await pessoasService.getAll();
        setPessoas(data);
      } catch (err) {
        console.error("Erro ao carregar pessoas para o select", err);
      }
    };
    loadPessoas();
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Razão Social *</label>
          <input
            {...register('razao_social')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Razão Social da empresa"
          />
          {errors.razao_social && <span className="text-destructive text-xs">{errors.razao_social.message}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Nome Fantasia</label>
          <input
            {...register('nome_fantasia')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">CNPJ *</label>
          <input
            {...register('cnpj')}
            onChange={(e) => setValue('cnpj', formatCNPJ(e.target.value))}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="00.000.000/0000-00"
          />
          {errors.cnpj && <span className="text-destructive text-xs">{errors.cnpj.message}</span>}
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Endereço Completo</label>
          <input
            {...register('endereco')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Contato Principal (Pessoa)</label>
          <select
            {...register('contato_principal_id')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Selecione um contato...</option>
            {pessoas.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-border mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-md border border-input bg-transparent hover:bg-muted text-sm font-medium transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors"
        >
          Salvar
        </button>
      </div>
    </form>
  );
}
