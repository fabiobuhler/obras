import { supabase } from './supabase';

export class ApiService {
  constructor(tableName) {
    this.tableName = tableName;
  }

  async getAll(options = {}) {
    let query = supabase.from(this.tableName).select('*');
    
    if (options.orderBy) {
      query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? true });
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async getById(id) {
    const { data, error } = await supabase.from(this.tableName).select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  }

  async create(record) {
    const { data, error } = await supabase.from(this.tableName).insert([record]).select().single();
    if (error) throw error;
    return data;
  }

  async update(id, updates) {
    const { data, error } = await supabase.from(this.tableName).update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async remove(id) {
    const { error } = await supabase.from(this.tableName).delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}
