import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useCrud(service) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async (options = {}) => {
    setLoading(true);
    try {
      const result = await service.getAll(options);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message || 'Erro ao carregar dados');
      toast.error(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [service]);

  const createRecord = async (record) => {
    setLoading(true);
    try {
      const newRecord = await service.create(record);
      setData((prev) => [...prev, newRecord]);
      setError(null);
      toast.success('Registro criado com sucesso!');
      return newRecord;
    } catch (err) {
      setError(err.message || 'Erro ao criar registro');
      toast.error(err.message || 'Erro ao criar registro');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateRecord = async (id, updates) => {
    setLoading(true);
    try {
      const updatedRecord = await service.update(id, updates);
      setData((prev) => prev.map((item) => (item.id === id ? updatedRecord : item)));
      setError(null);
      toast.success('Registro atualizado com sucesso!');
      return updatedRecord;
    } catch (err) {
      setError(err.message || 'Erro ao atualizar registro');
      toast.error(err.message || 'Erro ao atualizar registro');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async (id) => {
    setLoading(true);
    try {
      await service.remove(id);
      setData((prev) => prev.filter((item) => item.id !== id));
      setError(null);
      toast.success('Registro excluído com sucesso!');
    } catch (err) {
      setError(err.message || 'Erro ao excluir registro');
      toast.error(err.message || 'Erro ao excluir registro');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    loadData,
    createRecord,
    updateRecord,
    deleteRecord,
  };
}
