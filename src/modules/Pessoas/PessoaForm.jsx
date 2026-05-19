import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect } from 'react';
import { formatCPF, formatPhone } from '@/lib/formatters';

const pessoaSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cpf: z.string().optional(),
  data_nascimento: z.string().optional(),
  telefone1: z.string().min(10, 'Telefone obrigatório'),
  telefone1_whatsapp: z.boolean().default(false),
  telefone2: z.string().optional(),
  telefone2_whatsapp: z.boolean().default(false),
  chave_pix: z.string().optional(),
  tipo_pessoa: z.string().optional(),
});

export default function PessoaForm({ initialData, onSubmit, onCancel }) {
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    resolver: zodResolver(pessoaSchema),
    defaultValues: initialData || {
      telefone1_whatsapp: false,
      telefone2_whatsapp: false,
    }
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Nome Completo *</label>
          <input
            {...register('nome')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Nome da pessoa"
          />
          {errors.nome && <span className="text-destructive text-xs">{errors.nome.message}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">CPF</label>
          <input
            {...register('cpf')}
            onChange={(e) => setValue('cpf', formatCPF(e.target.value))}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="000.000.000-00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Data Nascimento</label>
          <input
            type="date"
            {...register('data_nascimento')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Telefone Principal *</label>
          <div className="flex items-center gap-2">
            <input
              {...register('telefone1')}
              onChange={(e) => setValue('telefone1', formatPhone(e.target.value))}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="(00) 00000-0000"
            />
            <label className="flex items-center gap-1 text-sm">
              <input type="checkbox" {...register('telefone1_whatsapp')} className="rounded border-border text-primary focus:ring-primary" />
              WhatsApp
            </label>
          </div>
          {errors.telefone1 && <span className="text-destructive text-xs">{errors.telefone1.message}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Telefone Secundário</label>
          <div className="flex items-center gap-2">
            <input
              {...register('telefone2')}
              onChange={(e) => setValue('telefone2', formatPhone(e.target.value))}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="(00) 00000-0000"
            />
            <label className="flex items-center gap-1 text-sm">
              <input type="checkbox" {...register('telefone2_whatsapp')} className="rounded border-border text-primary focus:ring-primary" />
              WhatsApp
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tipo Pessoa</label>
          <select
            {...register('tipo_pessoa')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Selecione...</option>
            <option value="Cliente">Cliente</option>
            <option value="Fornecedor">Fornecedor</option>
            <option value="Funcionario">Funcionário</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Chave PIX</label>
          <input
            {...register('chave_pix')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Chave para pagamento"
          />
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
