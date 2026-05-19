import { supabase } from './supabase';

const BUCKET_NAME = 'funcionarios-documentos';
const EQUIPAMENTOS_BUCKET = 'equipamentos-documentos';
const FINANCEIRO_BUCKET = 'financeiro-documentos';

export const storageService = {
  async uploadFuncionarioArquivo(file, funcionarioId, categoria) {
    if (!file) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `funcionarios/${funcionarioId}/${categoria}/${fileName}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Erro no upload:', error);
      throw error;
    }

    return this.getPublicUrl(filePath);
  },

  async uploadEquipamentoArquivo(file, equipamentoId, subfolder = 'documentos') {
    if (!file) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `equipamentos/${equipamentoId}/${subfolder}/${fileName}`;

    const { data, error } = await supabase.storage
      .from(EQUIPAMENTOS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Erro no upload de equipamento:', error);
      throw error;
    }

    return this.getPublicUrlEquipamento(filePath);
  },

  getPublicUrl(path) {
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);
    
    return data.publicUrl;
  },

  getPublicUrlEquipamento(path) {
    const { data } = supabase.storage
      .from(EQUIPAMENTOS_BUCKET)
      .getPublicUrl(path);
    
    return data.publicUrl;
  },

  async uploadFinanceiroArquivo(file, contaId, subfolder = 'documentos') {
    if (!file) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `contas/${contaId}/${subfolder}/${fileName}`;

    const { data, error } = await supabase.storage
      .from(FINANCEIRO_BUCKET)
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (error) {
      console.error('Erro no upload financeiro:', error);
      throw error;
    }

    return this.getPublicUrlFinanceiro(filePath);
  },

  getPublicUrlFinanceiro(path) {
    const { data } = supabase.storage
      .from(FINANCEIRO_BUCKET)
      .getPublicUrl(path);
    return data.publicUrl;
  },

  async deleteArquivo(pathOrUrl) {
    if (!pathOrUrl) return;
    
    // Extrai o path se for URL completa
    let path = pathOrUrl;
    if (path.includes(BUCKET_NAME)) {
      path = path.split(`${BUCKET_NAME}/`)[1];
    }
    
    if (!path) return;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.error('Erro ao excluir arquivo:', error);
      throw error;
    }
  },

  async removeFinanceiroByUrl(publicUrl) {
    if (!publicUrl) return false;
    try {
      if (publicUrl.includes(FINANCEIRO_BUCKET)) {
        const path = publicUrl.split(`${FINANCEIRO_BUCKET}/`)[1];
        if (path) {
          const { error } = await supabase.storage.from(FINANCEIRO_BUCKET).remove([path]);
          if (error) {
            console.error('Erro ao excluir arquivo financeiro do storage:', error);
            return false;
          }
        }
      }
      return true;
    } catch (error) {
      console.error('Erro exception ao excluir arquivo financeiro do storage:', error);
      return false;
    }
  }
};
