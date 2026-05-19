import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';
import { storageService } from '@/services/storageService';
import AsyncSearchableSelect from '@/components/ui/AsyncSearchableSelect';
import CurrencyInput from '@/components/ui/CurrencyInput';
import { toast } from 'sonner';

const toOptionalStr  = z.string().optional().nullable().transform(v => v || null);
const toOptionalUuid = z.string().optional().nullable().transform(v => (v?.length > 0 ? v : null));
const toOptionalNum  = z.coerce.number().optional().nullable();

const contaSchema = z.object({
  descricao:              z.string().min(2, 'Descrição obrigatória'),
  credor_pessoa_id:       toOptionalUuid,
  credor_empresa_id:      toOptionalUuid,
  credor_avulso:          toOptionalStr,
  obra_id:                toOptionalUuid,
  equipamento_id:         toOptionalUuid,
  origem:                 toOptionalStr,
  valor_total:            z.number({ required_error: 'Valor obrigatório' }).positive('Informe um valor'),
  vencimento:             z.string().min(1, 'Vencimento obrigatório'),
  status:                 toOptionalStr,
  forma_pagamento:        toOptionalStr,
  pagamento_direto_cliente: z.boolean().optional().default(false),
  observacao:             toOptionalStr,
  arquivo_url:            toOptionalStr,
});

const ORIGENS = [
  { value: 'avulso',       label: 'Avulso' },
  { value: 'locacao',      label: 'Locação de Equipamento' },
  { value: 'manutencao',   label: 'Manutenção' },
  { value: 'abastecimento',label: 'Abastecimento' },
  { value: 'funcionario',  label: 'Funcionário / RH' },
  { value: 'terceiro',     label: 'Serviço de Terceiro' },
  { value: 'fornecedor',   label: 'Fornecedor' },
];

const FORMAS_PAGAMENTO = [
  'PIX', 'Cheque', 'Cartão de Débito', 'Cartão de Crédito',
  'Boleto', 'Dinheiro', 'Transferência', 'Parcelado', 'Outro',
];

export default function ContaForm({ initialData, onSubmit, onCancel }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMode, setUploadMode] = useState('file');
  const [isUploading, setIsUploading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch, control } = useForm({
    resolver: zodResolver(contaSchema),
    defaultValues: initialData || { status: 'a_vencer', pagamento_direto_cliente: false, credor_avulso: '' },
  });

  const arquivoUrlAtual = watch('arquivo_url');

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      toast.error('Apenas PDF, JPG ou PNG.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) { toast.error('Máximo 10MB.'); return; }
    setSelectedFile(file);
    setValue('arquivo_url', '');
  };

  const handleFormSubmit = async (data) => {
    try {
      setIsUploading(true);
      const payload = {
        descricao:               data.descricao,
        credor_pessoa_id:        data.credor_pessoa_id || null,
        credor_empresa_id:       data.credor_empresa_id || null,
        credor_avulso:           data.credor_avulso || null,
        obra_id:                 data.obra_id || null,
        equipamento_id:          data.equipamento_id || null,
        origem:                  data.origem || null,
        valor_total:             data.valor_total,
        vencimento:              data.vencimento,
        status:                  data.status || 'a_vencer',
        forma_pagamento:         data.forma_pagamento || null,
        pagamento_direto_cliente: data.pagamento_direto_cliente || false,
        observacao:              data.observacao || null,
        arquivo_url:             selectedFile ? null : (data.arquivo_url || null),
      };

      if (selectedFile) {
        const contaId = initialData?.id || crypto.randomUUID();
        payload.id = contaId;
        payload.arquivo_url = await storageService.uploadFinanceiroArquivo(selectedFile, contaId);
      }

      await onSubmit(payload);
    } catch (error) {
      console.error('ERRO AO SALVAR CONTA:', error);
      toast.error(error.message || 'Erro ao salvar conta.');
    } finally {
      setIsUploading(false);
    }
  };

  const inputClass = "w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <form onSubmit={handleSubmit(handleFormSubmit, (errs) => {
      toast.error('Verifique os campos obrigatórios.');
    })} className="space-y-4">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Descrição */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Descrição *</label>
          <input {...register('descricao')} className={`${inputClass} ${errors.descricao ? 'border-red-500' : ''}`} placeholder="Ex: Aluguel retroescavadeira – Maio/2025" />
          {errors.descricao && <span className="text-red-500 text-xs">{errors.descricao.message}</span>}
        </div>

        {/* Credor Pessoa */}
        <div>
          <label className="block text-sm font-medium mb-1">Credor – Pessoa Física</label>
          <AsyncSearchableSelect control={control} name="credor_pessoa_id" table="pessoas" labelField="nome" placeholder="Buscar pessoa..." />
        </div>

        {/* Credor Empresa */}
        <div>
          <label className="block text-sm font-medium mb-1">Credor – Empresa / Fornecedor</label>
          <AsyncSearchableSelect control={control} name="credor_empresa_id" table="empresas" labelField="nome_fantasia" placeholder="Buscar empresa..." />
        </div>

        {/* Credor Avulso */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Credor Avulso</label>
          <input {...register('credor_avulso')} className={inputClass} placeholder="Nome do credor avulso (para contas sem cadastro prévio)..." />
          <span className="text-xs text-muted-foreground mt-1 block">Use este campo para contas avulsas sem cadastro prévio de pessoa ou empresa.</span>
        </div>

        {/* Obra */}
        <div>
          <label className="block text-sm font-medium mb-1">Obra Vinculada</label>
          <AsyncSearchableSelect control={control} name="obra_id" table="obras" labelField="objeto" placeholder="Buscar obra..." />
        </div>

        {/* Origem */}
        <div>
          <label className="block text-sm font-medium mb-1">Origem</label>
          <select {...register('origem')} className={inputClass}>
            <option value="">Selecione...</option>
            {ORIGENS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Valor Total */}
        <div>
          <label className="block text-sm font-medium mb-1">Valor Total *</label>
          <CurrencyInput
            onValueChange={(val) => setValue('valor_total', val)}
            defaultValue={initialData?.valor_total ?? initialData?.valor}
          />
          {errors.valor_total && <span className="text-red-500 text-xs">{errors.valor_total.message}</span>}
        </div>

        {/* Vencimento */}
        <div>
          <label className="block text-sm font-medium mb-1">Vencimento *</label>
          <input type="date" {...register('vencimento')} className={`${inputClass} ${errors.vencimento ? 'border-red-500' : ''}`} />
          {errors.vencimento && <span className="text-red-500 text-xs">{errors.vencimento.message}</span>}
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select {...register('status')} className={inputClass}>
            <option value="a_vencer">A Vencer</option>
            <option value="vencida">Vencida</option>
            <option value="paga">Paga</option>
            <option value="parcial">Parcial</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>

        {/* Forma de Pagamento */}
        <div>
          <label className="block text-sm font-medium mb-1">Forma de Pagamento</label>
          <select {...register('forma_pagamento')} className={inputClass}>
            <option value="">Selecione...</option>
            {FORMAS_PAGAMENTO.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        {/* Checkboxes */}
        <div className="md:col-span-2 flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" {...register('pagamento_direto_cliente')} className="h-4 w-4 rounded border-gray-300" />
            Pagamento direto pelo cliente
          </label>
        </div>

        {/* Observação */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Observação</label>
          <textarea {...register('observacao')} rows={2} className={inputClass} placeholder="Detalhes adicionais..." />
        </div>
      </div>

      {/* Upload boleto/documento */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium">Boleto / Documento</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setUploadMode('file')} className={`text-xs px-2 py-1 rounded ${uploadMode === 'file' ? 'bg-primary text-primary-foreground' : 'bg-gray-200 dark:bg-gray-700'}`}>Enviar Arquivo</button>
            <button type="button" onClick={() => setUploadMode('link')} className={`text-xs px-2 py-1 rounded ${uploadMode === 'link' ? 'bg-primary text-primary-foreground' : 'bg-gray-200 dark:bg-gray-700'}`}>Colar Link</button>
          </div>
        </div>

        {uploadMode === 'link' ? (
          <input {...register('arquivo_url')} className={inputClass} placeholder="https://..." />
        ) : (
          <div className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-zinc-800/30 relative min-h-[90px]">
            {selectedFile ? (
              <div className="flex items-center justify-between w-full p-2 bg-white dark:bg-zinc-900 rounded border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileIcon size={18} className="text-blue-500 shrink-0" />
                  <span className="text-sm truncate">{selectedFile.name}</span>
                  <span className="text-xs text-gray-400">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
                <button type="button" onClick={() => setSelectedFile(null)}><X size={15} className="text-gray-400 hover:text-red-500" /></button>
              </div>
            ) : (
              <>
                <UploadCloud size={28} className="text-gray-400 mb-1" />
                <p className="text-sm text-gray-500">Clique ou arraste o boleto</p>
                <p className="text-xs text-gray-400">PDF, JPG ou PNG (máx 10MB)</p>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                {arquivoUrlAtual && (
                  <div className="absolute inset-0 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center rounded-md z-10 p-3 border-2 border-green-500/40">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold mb-2">✓ Arquivo anexado</span>
                    <div className="flex gap-2">
                      <a href={arquivoUrlAtual} target="_blank" rel="noreferrer" className="px-3 py-1 bg-blue-600 text-white rounded text-xs z-20 relative">Abrir</a>
                      <button type="button" onClick={() => setValue('arquivo_url', '')} className="px-3 py-1 border rounded text-xs z-20 relative">Substituir</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-zinc-800">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md border border-gray-300 dark:border-zinc-700 text-sm font-medium hover:bg-gray-100 dark:hover:bg-zinc-800">Cancelar</button>
        <button type="submit" disabled={isUploading} className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {isUploading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}
