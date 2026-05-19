import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import { pessoasService } from '@/services/pessoasService';
import { empresasService } from '@/services/empresasService';

const obraSchema = z.object({
  cliente_id: z.string().uuid().optional().nullable(),
  endereco: z.string().min(5, 'Endereço deve ter no mínimo 5 caracteres'),
  objeto: z.string().min(3, 'Objeto (Descrição) deve ter no mínimo 3 caracteres'),
  responsavel_cliente_id: z.string().uuid().optional().nullable(),
  responsavel_empresa_id: z.string().uuid().optional().nullable(),
  data_inicio: z.string().optional().nullable(),
  data_fim: z.string().optional().nullable(),
  status: z.string().optional(),
});

export default function ObraForm({ initialData, onSubmit, onCancel }) {
  const [pessoas, setPessoas] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(obraSchema),
    defaultValues: initialData || { status: 'Ativa' }
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
    
    const loadDependencies = async () => {
      try {
        const [pData, eData] = await Promise.all([
          pessoasService.getAll(),
          empresasService.getAll()
        ]);
        setPessoas(pData);
        setEmpresas(eData);
      } catch (err) {
        console.error("Erro ao carregar dependências para Obras", err);
      }
    };
    loadDependencies();
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Objeto da Obra *</label>
          <input
            {...register('objeto')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Ex: Construção de Prédio Comercial"
          />
          {errors.objeto && <span className="text-destructive text-xs">{errors.objeto.message}</span>}
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Endereço Completo *</label>
          <input
            {...register('endereco')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Rua, Número, Bairro, Cidade - UF"
          />
          {errors.endereco && <span className="text-destructive text-xs">{errors.endereco.message}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Cliente (Empresa)</label>
          <select
            {...register('cliente_id')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Selecione...</option>
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>{e.razao_social}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            {...register('status')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="Em Planejamento">Em Planejamento</option>
            <option value="Ativa">Ativa</option>
            <option value="Pausada">Pausada</option>
            <option value="Concluída">Concluída</option>
            <option value="Cancelada">Cancelada</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Resp. Cliente (Pessoa)</label>
          <select
            {...register('responsavel_cliente_id')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Selecione...</option>
            {pessoas.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Resp. Nossa Empresa (Pessoa)</label>
          <select
            {...register('responsavel_empresa_id')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Selecione...</option>
            {pessoas.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Data Início</label>
          <input
            type="date"
            {...register('data_inicio')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Data Fim (Prevista/Real)</label>
          <input
            type="date"
            {...register('data_fim')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
