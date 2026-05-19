import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';
import { storageService } from '@/services/storageService';
import AsyncSearchableSelect from '@/components/ui/AsyncSearchableSelect';
import CurrencyInput from '@/components/ui/CurrencyInput';
import { toast } from 'sonner';

const toOptionalString = z.string().optional().nullable().transform(v => v || null);
const toOptionalUuid  = z.string().optional().nullable().transform(v => (v && v.length > 0 ? v : null));
const toOptionalNum   = z.coerce.number().optional().nullable().transform(v => v || null);

const equipamentoSchema = z.object({
  codigo:         toOptionalString,
  descricao:      z.string().min(2, 'A descrição é obrigatória'),
  tipo:           toOptionalString,
  categoria:      toOptionalString,
  origem:         z.enum(['proprio', 'locado']),
  patrimonio:     toOptionalString,
  fabricante:     toOptionalString,
  modelo:         toOptionalString,
  numero_serie:   toOptionalString,
  ano:            toOptionalNum,
  situacao:       toOptionalString,
  fornecedor_id:  toOptionalUuid,
  obra_atual_id:  toOptionalUuid,
  responsavel_id: toOptionalUuid,
  horimetro:      toOptionalNum,
  hodometro:      toOptionalNum,
  observacao:     toOptionalString,
  arquivo_url:    toOptionalString,

  // Campos de locação
  loc_fornecedor_id:         toOptionalUuid,
  loc_obra_id:               toOptionalUuid,
  loc_data_inicio:           toOptionalString,
  loc_previsao_devolucao:    toOptionalString,
  loc_data_devolucao:        toOptionalString,
  loc_tipo_locacao:          toOptionalString,
  loc_valor:                 z.number().optional().nullable(),
  loc_forma_pagamento:       toOptionalString,
  loc_status:                toOptionalString,
  loc_observacao:            toOptionalString,
  loc_quantidade_parcelas:   toOptionalNum,
  loc_data_primeira_parcela: toOptionalString,
  loc_pagamento_direto_cliente: z.boolean().optional().default(false),
});

export default function EquipamentoForm({ initialData, onSubmit, onCancel }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState('file');

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch, control } = useForm({
    resolver: zodResolver(equipamentoSchema),
    defaultValues: initialData || { origem: 'proprio', situacao: 'disponível', loc_status: 'ativa' }
  });

  const origemWatch = watch('origem');
  const formaPagamentoWatch = watch('loc_forma_pagamento');
  const dataDevolucaoWatch = watch('loc_data_devolucao');
  const arquivoUrlAtual = watch('arquivo_url');

  // Status automático baseado em data_devolucao
  useEffect(() => {
    if (dataDevolucaoWatch) {
      setValue('loc_status', 'encerrada');
    } else if (origemWatch === 'locado') {
      setValue('loc_status', 'ativa');
    }
  }, [dataDevolucaoWatch, origemWatch, setValue]);

  useEffect(() => {
    if (initialData) {
      reset({ ...initialData, loc_status: 'ativa' });
      setUploadMode('file');
    }
  }, [initialData, reset]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      toast.error('Tipo de arquivo inválido. Apenas PDF, JPG e PNG.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 10MB.');
      return;
    }
    setSelectedFile(file);
    setValue('arquivo_url', '');
  };

  const handleFormSubmit = async (data) => {
    try {
      setIsUploading(true);

      // Payload limpo — apenas colunas existentes na tabela equipamentos
      const equipamentoPayload = {
        equipamento: data.descricao,      // coluna legada obrigatória
        codigo: data.codigo || null,
        descricao: data.descricao,
        tipo: data.tipo || null,
        categoria: data.categoria || null,
        origem: data.origem,
        patrimonio: data.patrimonio || null,
        fabricante: data.fabricante || null,
        modelo: data.modelo || null,
        numero_serie: data.numero_serie || null,
        ano: data.ano || null,
        situacao: data.situacao || 'disponível',
        fornecedor_id: data.fornecedor_id || null,
        obra_atual_id: data.obra_atual_id || null,
        responsavel_id: data.responsavel_id || null,
        horimetro: data.horimetro || null,
        hodometro: data.hodometro || null,
        observacao: data.observacao || null,
        arquivo_url: selectedFile ? null : (data.arquivo_url || null),
      };

      // Upload de arquivo se selecionado
      if (selectedFile) {
        const equipId = initialData?.id || crypto.randomUUID();
        equipamentoPayload.id = equipId;
        const url = await storageService.uploadEquipamentoArquivo(selectedFile, equipId, 'documentos');
        equipamentoPayload.arquivo_url = url;
      }

      // Dados de locação separados (apenas se origem = locado)
      let locacaoPayload = null;
      if (data.origem === 'locado') {
        locacaoPayload = {
          fornecedor_id: data.loc_fornecedor_id || null,
          obra_id: data.loc_obra_id || null,
          data_inicio: data.loc_data_inicio || null,
          previsao_devolucao: data.loc_previsao_devolucao || null,
          data_devolucao: data.loc_data_devolucao || null,
          tipo_locacao: data.loc_tipo_locacao || null,
          valor: data.loc_valor || null,
          forma_pagamento: data.loc_forma_pagamento || null,
          // Status calculado: encerrada se data_devolucao preenchida
          status: data.loc_data_devolucao ? 'encerrada' : (data.loc_status || 'ativa').toLowerCase(),
          observacao: data.loc_observacao || null,
          ...(data.loc_forma_pagamento === 'parcelado' ? {
            quantidade_parcelas: data.loc_quantidade_parcelas || null,
            data_primeira_parcela: data.loc_data_primeira_parcela || null,
          } : {}),
          ...(data.loc_forma_pagamento === 'faturado direto ao cliente' ? {
            pagamento_direto_cliente: data.loc_pagamento_direto_cliente || false,
          } : {}),
        };
      }

      await onSubmit(equipamentoPayload, locacaoPayload);
    } catch (error) {
      console.error('ERRO NO FORM SUBMIT:', error);
      toast.error(error.message || 'Erro ao salvar equipamento.');
      throw error; // re-lança para o handleSubmit do EquipamentosList poder capturar também
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit, (errors) => {
      toast.error('Verifique os campos obrigatórios.');
    })} className="space-y-4">
      {/* Identificação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Código</label>
          <input {...register('codigo')} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Ex: EQ-001" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Descrição *</label>
          <input {...register('descricao')} className={`w-full rounded-md border bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${errors.descricao ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`} placeholder="Ex: Escavadeira Hidráulica 20T" />
          {errors.descricao && <span className="text-red-500 text-xs">{errors.descricao.message}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tipo</label>
          <input {...register('tipo')} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm" placeholder="Ex: Máquina Pesada" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Categoria</label>
          <input {...register('categoria')} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm" placeholder="Ex: Terraplanagem" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Origem *</label>
          <select {...register('origem')} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm">
            <option value="proprio">Próprio</option>
            <option value="locado">Locado</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Patrimônio</label>
          <input {...register('patrimonio')} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Fabricante</label>
          <input {...register('fabricante')} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Modelo</label>
          <input {...register('modelo')} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Nº Série / Chassi</label>
          <input {...register('numero_serie')} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ano</label>
          <input type="number" {...register('ano')} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Situação</label>
          <select {...register('situacao')} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm">
            <option value="disponível">Disponível</option>
            <option value="em uso">Em Uso</option>
            <option value="manutenção">Em Manutenção</option>
            <option value="devolvido">Devolvido</option>
            <option value="inativo">Inativo / Baixado</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Fornecedor / Locador</label>
          <AsyncSearchableSelect control={control} name="fornecedor_id" table="empresas" labelField="nome_fantasia" placeholder="Buscar fornecedor..." />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Obra Atual</label>
          <AsyncSearchableSelect control={control} name="obra_atual_id" table="obras" labelField="nome_obra" placeholder="Buscar obra..." />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Responsável / Operador</label>
          <AsyncSearchableSelect control={control} name="responsavel_id" table="pessoas" labelField="nome" placeholder="Buscar pessoa..." />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Horímetro</label>
          <input type="number" step="0.01" {...register('horimetro')} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Hodômetro</label>
          <input type="number" step="0.01" {...register('hodometro')} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Observação</label>
        <textarea {...register('observacao')} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm min-h-[60px]"></textarea>
      </div>

      {/* Bloco Dados de Locação — exibido apenas quando origem = locado */}
      {origemWatch === 'locado' && (
        <div className="border border-blue-200 dark:border-blue-800 rounded-md p-4 bg-blue-50/30 dark:bg-blue-950/20 space-y-4">
          <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
            📋 Dados da Locação
            <span className="text-xs font-normal text-blue-500">(registrado automaticamente na aba Locações)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fornecedor / Locador</label>
              <AsyncSearchableSelect control={control} name="loc_fornecedor_id" table="empresas" labelField="nome_fantasia" placeholder="Buscar fornecedor..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Obra de Alocação</label>
              <AsyncSearchableSelect control={control} name="loc_obra_id" table="obras" labelField="nome_obra" placeholder="Buscar obra..." />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Data Início</label>
              <input type="date" {...register('loc_data_inicio')} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Previsão de Devolução</label>
              <input type="date" {...register('loc_previsao_devolucao')} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Data de Devolução Real
                <span className="ml-2 text-xs text-gray-500">(preencher apenas se já foi devolvido — encerra a locação automaticamente)</span>
              </label>
              <input type="date" {...register('loc_data_devolucao')} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tipo de Locação</label>
              <select {...register('loc_tipo_locacao')} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm">
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
              <label className="block text-sm font-medium mb-1">Status da Locação</label>
              <select {...register('loc_status')} disabled={!!dataDevolucaoWatch} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed">
                <option value="ativa">Ativa</option>
                <option value="vencida">Vencida</option>
                <option value="encerrada">Encerrada</option>
              </select>
              {dataDevolucaoWatch && (
                <p className="text-xs text-orange-600 mt-1">Status definido automaticamente como "encerrada" por haver data de devolução real.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Valor</label>
              <CurrencyInput onValueChange={(val) => setValue('loc_valor', val)} defaultValue={initialData?.loc_valor} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Forma de Pagamento</label>
              <select {...register('loc_forma_pagamento')} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm">
                <option value="">Selecione...</option>
                <option value="à vista">À Vista</option>
                <option value="diário">Diário</option>
                <option value="semanal">Semanal</option>
                <option value="quinzenal">Quinzenal</option>
                <option value="mensal">Mensal</option>
                <option value="por medição">Por Medição</option>
                <option value="por etapa">Por Etapa</option>
                <option value="ao término da locação">Ao Término da Locação</option>
                <option value="parcelado">Parcelado</option>
                <option value="faturado direto ao cliente">Faturado Direto ao Cliente</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            {/* Campos extras: Parcelado */}
            {formaPagamentoWatch === 'parcelado' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Quantidade de Parcelas</label>
                  <input type="number" min="1" {...register('loc_quantidade_parcelas')} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm" placeholder="Ex: 6" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Data da 1ª Parcela</label>
                  <input type="date" {...register('loc_data_primeira_parcela')} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm" />
                </div>
              </>
            )}

            {/* Checkbox: Faturado direto ao cliente */}
            {formaPagamentoWatch === 'faturado direto ao cliente' && (
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" {...register('loc_pagamento_direto_cliente')} className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4" />
                  <span className="text-sm font-medium">Confirmar: pagamento será faturado diretamente ao cliente final</span>
                </label>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Observação da Locação</label>
              <textarea {...register('loc_observacao')} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm min-h-[50px]" placeholder="Condições contratuais, observações..."></textarea>
            </div>
          </div>
        </div>
      )}

      {/* Upload */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium">Anexar Documento do Equipamento</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setUploadMode('file')} className={`text-xs px-2 py-1 rounded ${uploadMode === 'file' ? 'bg-primary text-primary-foreground' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>Enviar Arquivo</button>
            <button type="button" onClick={() => setUploadMode('link')} className={`text-xs px-2 py-1 rounded ${uploadMode === 'link' ? 'bg-primary text-primary-foreground' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>Colar Link</button>
          </div>
        </div>

        {uploadMode === 'link' ? (
          <input {...register('arquivo_url')} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm" placeholder="https://meu-drive.com/doc.pdf" />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-zinc-800/30 relative min-h-[100px]">
            {selectedFile ? (
              <div className="flex items-center justify-between w-full p-2 bg-white dark:bg-zinc-900 rounded border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileIcon size={20} className="text-blue-500 shrink-0" />
                  <span className="text-sm truncate font-medium">{selectedFile.name}</span>
                  <span className="text-xs text-gray-500 shrink-0">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
                <button type="button" onClick={() => setSelectedFile(null)} className="text-gray-500 hover:text-red-500 p-1"><X size={16} /></button>
              </div>
            ) : (
              <>
                <UploadCloud size={32} className="text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-300">Clique ou arraste um arquivo</p>
                <p className="text-xs text-gray-500 mt-1">PDF, JPG ou PNG (Máx 10MB)</p>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />

                {arquivoUrlAtual && !selectedFile && (
                  <div className="absolute inset-0 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center rounded-md z-10 p-4 border-2 border-green-500/50">
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold mb-3">✓ Arquivo anexado</div>
                    <p className="text-sm text-center mb-4">Já existe um documento anexado a este equipamento.</p>
                    <div className="flex gap-2">
                      <a href={arquivoUrlAtual} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 z-20 relative">Abrir arquivo</a>
                      <button type="button" onClick={() => setValue('arquivo_url', '')} className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-xs font-medium hover:bg-gray-100 dark:hover:bg-zinc-800 z-20 relative">Substituir</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-zinc-800 mt-6">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-transparent hover:bg-gray-100 dark:hover:bg-zinc-800 text-sm font-medium transition-colors">Cancelar</button>
        <button type="submit" disabled={isUploading} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-50">
          {isUploading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}
