import supabase from '../supabase.js';
import config from '../../config/config.js';

/**
 * Servicio para manejar la configuración persistente del bot
 * Gestiona el estado del bot (activo/pausado), estadísticas y metadatos
 */
class BotConfigService {
    constructor() {
        // Determinar el ambiente actual
        this.environment = process.env.NODE_ENV || process.env.ENV || 'development';
        console.log(`[BotConfigService] Inicializado para ambiente: ${this.environment}`);
    }

    /**
     * Obtiene la configuración actual del bot desde la base de datos
     * @returns {Promise<Object>} Configuración del bot
     */
    async getBotConfig() {
        try {
            const { data, error } = await supabase.rpc('get_bot_config', {
                p_environment: this.environment
            });

            if (error) {
                console.error('[BotConfigService] Error al obtener configuración:', error);
                throw error;
            }

            // La función retorna un array, tomamos el primer elemento
            const botConfig = data && data.length > 0 ? data[0] : null;
            
            if (!botConfig) {
                console.log('[BotConfigService] No se encontró configuración, creando una nueva...');
                await this.createInitialConfig();
                return await this.getBotConfig(); // Recursión para obtener la configuración recién creada
            }

            console.log(`[BotConfigService] Configuración obtenida:`, {
                environment: botConfig.environment,
                is_paused: botConfig.is_paused,
                paused_by: botConfig.paused_by
            });

            return botConfig;
        } catch (error) {
            console.error('[BotConfigService] Error en getBotConfig:', error);
            throw error;
        }
    }

    /**
     * Crea la configuración inicial del bot si no existe
     * @returns {Promise<void>}
     */
    async createInitialConfig() {
        try {
            const { error } = await supabase.rpc('create_bot_config_if_not_exists', {
                p_environment: this.environment
            });

            if (error) {
                console.error('[BotConfigService] Error al crear configuración inicial:', error);
                throw error;
            }

            console.log(`[BotConfigService] Configuración inicial creada para ambiente: ${this.environment}`);
        } catch (error) {
            console.error('[BotConfigService] Error en createInitialConfig:', error);
            throw error;
        }
    }

    /**
     * Actualiza el estado del bot (pausado/activo)
     * @param {boolean} isPaused - Si el bot está pausado
     * @param {string} pausedBy - Número de teléfono del administrador que pausó el bot
     * @returns {Promise<void>}
     */
    async updateBotState(isPaused, pausedBy = null) {
        try {
            const { error } = await supabase.rpc('update_bot_state', {
                p_environment: this.environment,
                p_is_paused: isPaused,
                p_paused_by: pausedBy
            });

            if (error) {
                console.error('[BotConfigService] Error al actualizar estado del bot:', error);
                throw error;
            }

            console.log(`[BotConfigService] Estado actualizado: ${isPaused ? 'PAUSADO' : 'ACTIVO'}${pausedBy ? ` por ${pausedBy}` : ''}`);
        } catch (error) {
            console.error('[BotConfigService] Error en updateBotState:', error);
            throw error;
        }
    }

    /**
     * Reinicia completamente la configuración del bot
     * @returns {Promise<void>}
     */
    async resetBotConfig() {
        try {
            const { error } = await supabase.rpc('update_bot_state', {
                p_environment: this.environment,
                p_is_paused: false,
                p_paused_by: null
            });

            if (error) {
                console.error('[BotConfigService] Error al reiniciar configuración:', error);
                throw error;
            }
            
            console.log('[BotConfigService] Configuración del bot reiniciada completamente');
        } catch (error) {
            console.error('[BotConfigService] Error en resetBotConfig:', error);
            throw error;
        }
    }

    /**
     * Obtiene el ambiente actual
     * @returns {string} Ambiente actual (development/production)
     */
    getEnvironment() {
        return this.environment;
    }
}

// Exportar una instancia singleton del servicio
const botConfigService = new BotConfigService();
export default botConfigService;