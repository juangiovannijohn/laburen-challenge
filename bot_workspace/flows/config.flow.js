import { addKeyword, EVENTS } from '@builderbot/bot';
import MessageBuffer from '../middleware/messageBuffer.js';

// Estado global del bot
let botState = {
    isPaused: false,
    pausedAt: null,
    totalMessages: 0,
    configCommands: 0
};

/**
 * Flow de configuración del bot
 * Maneja comandos especiales de administración
 */
const configFlow = addKeyword(['#config', '#admin', '#bot'])
    .addAction(async (ctx, { flowDynamic, state, endFlow }) => {
        const { from, body } = ctx;
        const command = body.toLowerCase().trim();
        
        console.log(`[ConfigFlow] Comando recibido de ${from}: ${command}`);
        botState.configCommands++;
        
        // Comandos de configuración
        switch (command) {
            case '#pausar':
            case '#pause':
                botState.isPaused = true;
                botState.pausedAt = new Date();
                await flowDynamic('🔴 *Bot pausado*\n\nEl bot ha sido pausado temporalmente. Para reactivarlo usa: #activar');
                break;
                
            case '#activar':
            case '#resume':
                botState.isPaused = false;
                botState.pausedAt = null;
                await flowDynamic('🟢 *Bot activado*\n\nEl bot está funcionando normalmente.');
                break;
                
            case '#estadisticas':
            case '#stats':
                const stats = await getStats();
                await flowDynamic(stats);
                break;
                
            case '#promocion':
            case '#promo':
                const promoMessage = `🎉 *¡PROMOCIÓN ESPECIAL!* 🎉

🛍️ *Descuento del 20% en todos nuestros productos*
⏰ *Válido hasta fin de mes*
🚚 *Envío gratis en compras mayores a $50*

¡No te pierdas esta oportunidad única!
Escribe "productos" para ver nuestro catálogo.`;
                await flowDynamic(promoMessage);
                break;
                
            case '#limpiar':
            case '#clear':
                // Limpiar buffers de mensajes
                const messageBuffer = new MessageBuffer();
                const cleared = messageBuffer.clearAllBuffers();
                await flowDynamic(`🧹 *Buffers limpiados*\n\nSe limpiaron ${cleared} buffers activos.`);
                break;
                
            case '#reiniciar':
            case '#restart':
                botState = {
                    isPaused: false,
                    pausedAt: null,
                    totalMessages: 0,
                    configCommands: 0
                };
                await flowDynamic('🔄 *Bot reiniciado*\n\nTodas las estadísticas y configuraciones han sido reiniciadas.');
                break;
                
            case '#ayuda':
            case '#help':
                const helpMessage = `🤖 *Comandos de Administración*

*Control del Bot:*
• #pausar - Pausar el bot
• #activar - Activar el bot
• #reiniciar - Reiniciar configuraciones

*Información:*
• #estadisticas - Ver estadísticas del bot
• #ayuda - Mostrar esta ayuda

*Acciones:*
• #promocion - Enviar mensaje promocional
• #limpiar - Limpiar buffers de mensajes

*Estado actual:* ${botState.isPaused ? '🔴 Pausado' : '🟢 Activo'}`;
                await flowDynamic(helpMessage);
                break;
                
            default:
                await flowDynamic(`❌ *Comando no reconocido*\n\nUsa #ayuda para ver los comandos disponibles.`);
        }
        
        return endFlow();
    });

/**
 * Función para obtener estadísticas del bot
 */
async function getStats() {
    const messageBuffer = new MessageBuffer();
    const bufferStats = messageBuffer.getStats();
    const uptime = botState.pausedAt ? 
        `Pausado desde: ${botState.pausedAt.toLocaleString()}` : 
        'Funcionando normalmente';
    
    return `📊 *Estadísticas del Bot*

*Estado:* ${botState.isPaused ? '🔴 Pausado' : '🟢 Activo'}
*Uptime:* ${uptime}

*Mensajes:*
• Total procesados: ${botState.totalMessages}
• Comandos config: ${botState.configCommands}

*Buffer de Mensajes:*
• Buffers activos: ${bufferStats.activeBuffers}
• Total procesados: ${bufferStats.totalProcessed}

*Última actualización:* ${new Date().toLocaleString()}`;
}

/**
 * Middleware para verificar si el bot está pausado
 */
function checkBotStatus() {
    return botState.isPaused;
}

export { 
    configFlow, 
    checkBotStatus,
    botState 
};
