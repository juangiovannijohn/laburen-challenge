import { addKeyword, EVENTS } from '@builderbot/bot';
import { AUTHORIZED_NUMBERS } from '../../config/config.js';
import botConfigService from '../../database/services/bot-config.service.js';

// Estado global del bot (se cargará desde la base de datos)
let botState = {
    isPaused: false,
    pausedAt: null,
    pausedBy: null
};

// Contadores en memoria (no persistentes)
let memoryStats = {
    totalMessages: 0,
    configCommands: 0,
    startTime: new Date()
};

// Variable para controlar si el estado ya fue inicializado
let stateInitialized = false;

/**
 * Inicializa el estado del bot desde la base de datos
 */
async function initializeBotState() {
    if (stateInitialized) return;
    
    try {
        console.log('[ConfigFlow] Inicializando estado del bot desde la base de datos...');
        const config = await botConfigService.getBotConfig();
        
        botState.isPaused = config.is_paused;
        botState.pausedAt = config.paused_at ? new Date(config.paused_at) : null;
        botState.pausedBy = config.paused_by;
        
        stateInitialized = true;
        
        console.log('[ConfigFlow] Estado del bot inicializado:', {
            isPaused: botState.isPaused,
            pausedBy: botState.pausedBy
        });
        
        console.log('[ConfigFlow] Estadísticas en memoria inicializadas:', {
            totalMessages: memoryStats.totalMessages,
            configCommands: memoryStats.configCommands,
            startTime: memoryStats.startTime
        });
    } catch (error) {
        console.error('[ConfigFlow] Error al inicializar estado del bot:', error);
        // En caso de error, mantener el estado por defecto
        stateInitialized = true;
    }
}

/**
 * Verifica si un número está autorizado para usar comandos de configuración
 * @param {string} phone - Número de teléfono del usuario
 * @returns {boolean} - True si está autorizado, false si no
 */
function isAuthorizedUser(phone) {
    // Limpiar el número de teléfono (remover espacios, guiones, etc.)
    console.log(`[ConfigFlow] Número original: ${phone}`);
    const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '');
    console.log(`[ConfigFlow] Número limpio: ${cleanPhone}`);
        
        // Comprobar si el número está en la lista de autorizados
        const isAuthorized = AUTHORIZED_NUMBERS.includes(cleanPhone);
        console.log(`[ConfigFlow] Autorizado: ${isAuthorized}`);
        
        return isAuthorized;
}

/**
 * Flow de configuración del bot
 * Maneja comandos especiales de administración
 */
const configFlow = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, { flowDynamic, endFlow }) => {
        // Inicializar estado del bot si no se ha hecho
        await initializeBotState();
        
        // Verificar autorización
        if (!isAuthorizedUser(ctx.from)) {
            console.log(`[ConfigFlow] Acceso denegado para: ${ctx.from}`);
            await flowDynamic('❌ *Acceso Denegado*\n\nNo tienes permisos para usar comandos de configuración.');
            return endFlow();
        }

        const userMessage = ctx.body.toLowerCase().trim();
        const userPhone = ctx.from;

        console.log(`[ConfigFlow] Comando recibido de ${userPhone}: ${userMessage}`);

        // Incrementar contador de comandos de configuración en memoria
        memoryStats.configCommands++;

        if (userMessage === '#pausar' || userMessage === '#pause') {
            botState.isPaused = true;
            botState.pausedAt = new Date();
            botState.pausedBy = userPhone;
            
            // Persistir en la base de datos
            await botConfigService.updateBotState(true, userPhone);
            
            await flowDynamic(`🔴 *Bot Pausado*\n\nEl bot ha sido pausado por el administrador.\nPausado por: ${userPhone}\nFecha: ${botState.pausedAt.toLocaleString('es-ES')}`);
        } else if (userMessage === '#activar' || userMessage === '#resume') {
            botState.isPaused = false;
            botState.pausedAt = null;
            const previousPausedBy = botState.pausedBy;
            botState.pausedBy = null;
            
            // Persistir en la base de datos
            await botConfigService.updateBotState(false, null);
            
            await flowDynamic(`🟢 *Bot Activado*\n\nEl bot ha sido reactivado y está funcionando normalmente.\nReactivado por: ${userPhone}${previousPausedBy ? `\nAntes pausado por: ${previousPausedBy}` : ''}`);
        } else if (userMessage === '#stats' || userMessage === '#estadisticas') {
            // Obtener información actualizada de la base de datos
            const dbConfig = await botConfigService.getBotConfig();
            
            const statusIcon = dbConfig.is_paused ? '🔴' : '🟢';
            const statusText = dbConfig.is_paused ? 'PAUSADO' : 'ACTIVO';
            
            // Calcular tiempo de funcionamiento
            const uptime = new Date() - memoryStats.startTime;
            const uptimeHours = Math.floor(uptime / (1000 * 60 * 60));
            const uptimeMinutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
            
            let statsMessage = `📊 *Estadísticas del Bot*\n\n`;
            
            // Información de la base de datos
            statsMessage += `🗄️ *Estado Persistente:*\n`;
            statsMessage += `Estado: ${statusIcon} ${statusText}\n`;
            statsMessage += `Ambiente: ${botConfigService.getEnvironment()}\n`;
            statsMessage += `Creado: ${new Date(dbConfig.created_at).toLocaleString('es-ES')}\n`;
            statsMessage += `Actualizado: ${new Date(dbConfig.updated_at).toLocaleString('es-ES')}\n`;
            
            if (dbConfig.is_paused && dbConfig.paused_at) {
                statsMessage += `\n⏸️ *Información de Pausa:*\n`;
                statsMessage += `Pausado desde: ${new Date(dbConfig.paused_at).toLocaleString('es-ES')}\n`;
                if (dbConfig.paused_by) {
                    statsMessage += `Pausado por: ${dbConfig.paused_by}\n`;
                }
            }
            
            // Estadísticas en memoria
            statsMessage += `\n💾 *Estadísticas de Sesión:*\n`;
            statsMessage += `Mensajes procesados: ${memoryStats.totalMessages}\n`;
            statsMessage += `Comandos de configuración: ${memoryStats.configCommands}\n`;
            statsMessage += `Tiempo activo: ${uptimeHours}h ${uptimeMinutes}m\n`;
            statsMessage += `Iniciado: ${memoryStats.startTime.toLocaleString('es-ES')}\n`;
            
            await flowDynamic(statsMessage);
        } else if (userMessage === '#reset') {
            // Resetear solo las estadísticas en memoria
            memoryStats.totalMessages = 0;
            memoryStats.configCommands = 0;
            memoryStats.startTime = new Date();
            
            await flowDynamic(`🔄 *Estadísticas de Sesión Reiniciadas*\n\nLas estadísticas en memoria han sido reiniciadas.\nEstado del bot: ${botState.isPaused ? '🔴 PAUSADO' : '🟢 ACTIVO'}\n\n💡 *Nota:* El estado persistente del bot se mantiene en la base de datos.`);
        } else if (userMessage === '#help' || userMessage === '#ayuda') {
            let helpMessage = `🤖 *Comandos de Configuración Disponibles:*\n\n`;
            helpMessage += `🔴 *#pausar* o *#pause* - Pausar el bot\n`;
            helpMessage += `🟢 *#activar* o *#resume* - Activar el bot\n`;
            helpMessage += `📊 *#stats* o *#estadisticas* - Ver estadísticas\n`;
            helpMessage += `🔄 *#reset* - Reiniciar estadísticas de sesión\n`;
            helpMessage += `❓ *#help* o *#ayuda* - Mostrar esta ayuda\n\n`;
            helpMessage += `ℹ️ Solo los administradores autorizados pueden usar estos comandos.`;
            
            await flowDynamic(helpMessage);
        } else {
            await flowDynamic(`❓ *Comando no reconocido*\n\nUsa *#help* o *#ayuda* para ver los comandos disponibles.`);
        }
    });

/**
 * Función para obtener el estado actual del bot
 * @returns {Object} Estado actual del bot
 */
function getBotState() {
    return { ...botState };
}

/**
 * Función para verificar si el bot está pausado
 * @returns {boolean} True si el bot está pausado
 */
function isBotPaused() {
    return botState.isPaused;
}

/**
 * Función para incrementar el contador de mensajes
 */
async function incrementMessageCount() {
    if (!stateInitialized) {
        await initializeBotState();
    }
    
    memoryStats.totalMessages++;
}

export { configFlow, isAuthorizedUser, getBotState, isBotPaused, incrementMessageCount, initializeBotState };
