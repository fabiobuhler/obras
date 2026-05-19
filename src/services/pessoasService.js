import { ApiService } from './apiService';

class PessoasService extends ApiService {
  constructor() {
    super('pessoas');
  }

  // Aqui podemos adicionar métodos específicos para 'pessoas', se necessário.
  // ex: buscar por cargo, status, etc.
}

export const pessoasService = new PessoasService();
