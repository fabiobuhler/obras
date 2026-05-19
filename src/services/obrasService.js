import { ApiService } from './apiService';

class ObrasService extends ApiService {
  constructor() {
    super('obras');
  }
}

export const obrasService = new ObrasService();
