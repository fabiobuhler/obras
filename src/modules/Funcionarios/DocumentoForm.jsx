import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';
import { storageService } from '@/services/storageService';
import { toast } from 'sonner';

const documentoSchema = z.object({
  tipo_documento: z.string().min(2, 'O tipo de documento é obrigatório'),
  descricao: z.string().optional(),
  data_emissao: z.string().optional(),
  validade: z.string().optional(),
  observacao: z.string().optional(),
  arquivo_url: z.string().optional(),
});

export default function DocumentoForm({ initialData, funcionarioId, onSubmit, onCancel }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState('file'); // 'file' ou 'link'

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm({
    resolver: zodResolver(documentoSchema),
    defaultValues: initialData || {}
  });

  const arquivoUrlAtual = watch('arquivo_url');

  useEffect(() => {
    if (initialData) {
      reset(initialData);
      setUploadMode('file');
    }
  }, [initialData, reset]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast.error('Tipo de arquivo inválido. Apenas PDF, JPG e PNG são permitidos.');
      return;
    }

    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 10MB.');
      return;
    }

    setSelectedFile(file);
    setValue('arquivo_url', ''); // Limpa o link manual se escolher arquivo
  };

  const handleFormSubmit = async (data) => {
    try {
      setIsUploading(true);
      const payload = {
        funcionario_id: funcionarioId,
        tipo_documento: data.tipo_documento,
        descricao: data.descricao || null,
        data_emissao: data.data_emissao || null,
        validade: data.validade || null,
        observacao: data.observacao || null,
        arquivo_url: selectedFile ? null : (data.arquivo_url || null),
      };

      if (selectedFile) {
        const url = await storageService.uploadFuncionarioArquivo(
          selectedFile,
          funcionarioId,
          'documentos'
        );
        payload.arquivo_url = url;
      }

      await onSubmit(payload);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao processar arquivo.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Tipo de Documento *</label>
          <input
            {...register('tipo_documento')}
            className={`w-full rounded-md border bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${errors.tipo_documento ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
            placeholder="Ex: RG, CNH, Comprovante de Residência"
          />
          {errors.tipo_documento && <span className="text-red-500 text-xs">{errors.tipo_documento.message}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Descrição</label>
          <input
            {...register('descricao')}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Ex: CNH Categoria B"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Data de Emissão</label>
          <input
            type="date"
            {...register('data_emissao')}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Validade</label>
          <input
            type="date"
            {...register('validade')}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="col-span-2">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">Anexar Documento</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUploadMode('file')}
                className={`text-xs px-2 py-1 rounded ${uploadMode === 'file' ? 'bg-primary text-primary-foreground' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              >
                Enviar Arquivo
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('link')}
                className={`text-xs px-2 py-1 rounded ${uploadMode === 'link' ? 'bg-primary text-primary-foreground' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              >
                Colar Link
              </button>
            </div>
          </div>

          {uploadMode === 'link' ? (
            <input
              {...register('arquivo_url')}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://meu-drive.com/arquivo.pdf"
            />
          ) : (
            <div className="mt-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-zinc-800/30 relative">
              {selectedFile ? (
                <div className="flex items-center justify-between w-full p-2 bg-white dark:bg-zinc-900 rounded border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileIcon size={20} className="text-blue-500 shrink-0" />
                    <span className="text-sm truncate font-medium">{selectedFile.name}</span>
                    <span className="text-xs text-gray-500 shrink-0">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                  <button type="button" onClick={() => setSelectedFile(null)} className="text-gray-500 hover:text-red-500 p-1">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <UploadCloud size={32} className="text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-300">Clique para selecionar ou arraste um arquivo</p>
                  <p className="text-xs text-gray-500 mt-1">PDF, JPG ou PNG (Máx 10MB)</p>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {arquivoUrlAtual && !selectedFile && (
                    <div className="absolute inset-0 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center rounded-md z-10 p-4 border-2 border-green-500/50">
                      <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold mb-3 flex items-center gap-1">
                        ✓ Arquivo anexado
                      </div>
                      <p className="text-sm text-center mb-4">Já existe um documento anexado a este registro.</p>
                      <div className="flex gap-2">
                        <a 
                          href={arquivoUrlAtual} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 z-20 relative"
                        >
                          Abrir arquivo
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setValue('arquivo_url', '');
                          }}
                          className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-xs font-medium hover:bg-gray-100 dark:hover:bg-zinc-800 z-20 relative"
                        >
                          Substituir
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Observação</label>
          <textarea
            {...register('observacao')}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[60px]"
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
          disabled={isUploading}
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isUploading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}
