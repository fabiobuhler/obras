import { supabase } from './supabase';

const normalizeFromDb = (record) => {
  if (!record) return record;

  return {
    ...record,
    quantidade_horas: Number(record.quantidade_horas || 0),
    multiplicador: Number(record.multiplicador || 1),
    valor_unitario: Number(record.valor_unitario || 0),
    custo_total: Number(record.custo_total || 0),
  };
};

const calcularCustoTotal = (payload) => {
  const horas = Number(payload.quantidade_horas || 0);
  const valorUnitario = Number(payload.valor_unitario || 0);
  const multiplicador = Number(payload.multiplicador || 1);

  return Number((horas * valorUnitario * multiplicador).toFixed(2));
};

export const apontamentosObraService = {
  async getAll(filtros = {}) {
    let query = supabase
      .from('apontamentos_obra')
      .select(`
        *,
        obras:obra_id (
          id,
          objeto
        ),
        funcionarios:funcionario_id (
          id,
          pessoa_id,
          pessoas:pessoa_id (
            id,
            nome,
            cpf
          )
        ),
        equipamentos:equipamento_id (
          id,
          codigo,
          descricao,
          tipo,
          categoria,
          patrimonio,
          fabricante,
          modelo
        )
      `)
      .order('data', { ascending: false });

    if (filtros.obraId) {
      query = query.eq('obra_id', filtros.obraId);
    }

    if (filtros.tipo) {
      query = query.eq('tipo', filtros.tipo);
    }

    if (filtros.dataInicio) {
      query = query.gte('data', filtros.dataInicio);
    }

    if (filtros.dataFim) {
      query = query.lte('data', filtros.dataFim);
    }

    const { data, error } = await query;

    if (error) {
      // If table doesn't exist yet, we propagate the error so the UI can display a friendly message
      throw error;
    }

    return (data || []).map(normalizeFromDb);
  },

  async getByObra(obraId, filtros = {}) {
    return this.getAll({
      ...filtros,
      obraId,
    });
  },

  async create(payload) {
    const dataToInsert = {
      ...payload,
      custo_total: calcularCustoTotal(payload),
    };

    const { data, error } = await supabase
      .from('apontamentos_obra')
      .insert(dataToInsert)
      .select(`
        *,
        obras:obra_id (
          id,
          objeto
        ),
        funcionarios:funcionario_id (
          id,
          pessoa_id,
          pessoas:pessoa_id (
            id,
            nome,
            cpf
          )
        ),
        equipamentos:equipamento_id (
          id,
          codigo,
          descricao,
          tipo,
          categoria,
          patrimonio,
          fabricante,
          modelo
        )
      `)
      .single();

    if (error) throw error;

    return normalizeFromDb(data);
  },

  async update(id, payload) {
    const dataToUpdate = {
      ...payload,
      custo_total: calcularCustoTotal(payload),
    };

    const { data, error } = await supabase
      .from('apontamentos_obra')
      .update(dataToUpdate)
      .eq('id', id)
      .select(`
        *,
        obras:obra_id (
          id,
          objeto
        ),
        funcionarios:funcionario_id (
          id,
          pessoa_id,
          pessoas:pessoa_id (
            id,
            nome,
            cpf
          )
        ),
        equipamentos:equipamento_id (
          id,
          codigo,
          descricao,
          tipo,
          categoria,
          patrimonio,
          fabricante,
          modelo
        )
      `)
      .single();

    if (error) throw error;

    return normalizeFromDb(data);
  },

  async remove(id) {
    const { error } = await supabase
      .from('apontamentos_obra')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return true;
  },

  async getResumoPorObra(obraId, filtros = {}) {
    try {
      const apontamentos = await this.getByObra(obraId, filtros);

      return apontamentos.reduce(
        (acc, item) => {
          const custo = Number(item.custo_total || 0);
          const horas = Number(item.quantidade_horas || 0);

          acc.custoTotal += custo;
          acc.quantidade += 1;

          if (item.tipo === 'mao_obra') {
            acc.custoMaoObra += custo;
            acc.horasMaoObra += horas;
          }

          if (item.tipo === 'equipamento') {
            acc.custoEquipamentos += custo;
            acc.horasEquipamentos += horas;
          }

          return acc;
        },
        {
          custoTotal: 0,
          custoMaoObra: 0,
          custoEquipamentos: 0,
          horasMaoObra: 0,
          horasEquipamentos: 0,
          quantidade: 0,
        }
      );
    } catch (err) {
      // If table doesn't exist, return empty stats without crashing
      return {
        custoTotal: 0,
        custoMaoObra: 0,
        custoEquipamentos: 0,
        horasMaoObra: 0,
        horasEquipamentos: 0,
        quantidade: 0,
      };
    }
  },
};
