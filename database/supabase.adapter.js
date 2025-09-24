import { MemoryDB } from '@builderbot/bot';
import supabase from './supabase.js';

class SupabaseDB extends MemoryDB {
  constructor() {
    super();
    console.log('🗄️  Inicializando SupabaseDB Adapter');
  }

  /**
   * Obtiene el historial completo de una conversación desde Supabase.
   * Este método es llamado por el bot para poblar `ctx.history`.
   * @param {string} phone - El número de teléfono del usuario.
   * @returns {Promise<Array>} - El historial de la conversación.
   */
  async get(phone) {
    try {
      const { data, error } = await supabase.from('conversation_history').select('history').eq('phone', phone).single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Si hay datos, los guardamos en la memoria local (comportamiento de MemoryDB)
      if (data?.history) {
        this.listHistory = data.history;
      }

      return this.listHistory;
    } catch (error) {
      console.error(`Error al obtener el historial para ${phone}:`, error);
      return [];
    }
  }

  /**
   * Guarda una nueva interacción (pregunta/respuesta) en el historial de Supabase.
   * Es llamado automáticamente por el bot después de cada `addAnswer`.
   * @param {object} ctx
   */
  async save(ctx) {
    const newEntries = [];

    if (ctx.keyword) {
      newEntries.push({
        role: 'user',
        content: ctx.keyword,
      });
    }

    newEntries.push({
      role: 'assistant',
      content: ctx.answer,
    });

    try {
      const { error } = await supabase.rpc('append_to_history', {
        p_phone: ctx.from,
        p_new_entries: JSON.stringify(newEntries),
      });

      if (error) {
        console.error('Error en RPC append_to_history:', error);
      }
    } catch (rpcError) {
      console.error('Error fatal llamando a RPC:', rpcError);
    }

    this.listHistory.push(...newEntries);
  }
}

export default SupabaseDB;
