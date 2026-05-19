import { ApiService } from './apiService';

class EmpresasService extends ApiService {
  constructor() {
    super('empresas');
  }
}

export const empresasService = new EmpresasService();
