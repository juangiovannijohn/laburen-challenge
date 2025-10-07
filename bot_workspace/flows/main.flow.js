import { addKeyword, EVENTS } from '@builderbot/bot';
import MessageBuffer from '../middleware/messageBuffer.js';
import { agentFlow } from './agent.flow.js';
import { configFlow, checkBotStatus, botState } from './config.flow.js';

// Crear instancia global del buffer de mensajes
const messageBuffer = new MessageBuffer(2000); // 2 segundos de delay

/**
 * Flow principal que maneja el buffering de mensajes
 * Intercepta todos los mensajes y decide si agruparlos o procesarlos inmediatamente
 */
export const mainFlow = addKeyword(EVENTS.WELCOME)
  .addAction(async (ctx, { flowDynamic, gotoFlow, state }) => {
    try {
      // Verificar si el bot está pausado
      if (checkBotStatus()) {
        console.log(`[MainFlow]: Bot pausado, ignorando mensaje de ${ctx.from}`);
        
        // Solo procesar comandos de activación
        const message = ctx.body.toLowerCase().trim();
        if (message === '#activar' || message === '#resume') {
          console.log(`[MainFlow]: Comando de activación detectado, redirigiendo a configFlow`);
          return gotoFlow(configFlow);
        }
        
        // Para cualquier otro mensaje, terminar silenciosamente sin responder
        console.log(`[MainFlow]: Bot pausado, mensaje ignorado silenciosamente`);
        return; // Terminar sin procesar ni responder el mensaje
      }

      const userId = ctx.from;
      const message = {
        body: ctx.body,
        messageType: ctx.messageType,
        mediaUrl: ctx.mediaUrl,
        from: ctx.from
      };

      console.log(`[MainFlow]: Mensaje recibido de ${userId}: "${ctx.body}"`);

      // Incrementar contador de mensajes totales
      botState.totalMessages++;

      // Configurar callback de procesamiento si no está configurado
      if (!messageBuffer.processingCallback) {
        messageBuffer.setProcessingCallback(async (userId, groupedMessages, combinedText) => {
          await processGroupedMessages(userId, groupedMessages, combinedText, { flowDynamic, gotoFlow, state });
        });
      }

      // Intentar agregar al buffer
      const wasBuffered = messageBuffer.addMessage(userId, message);

      if (!wasBuffered) {
        // Si no se buffeó, significa que es un comando de configuración
        // que debe procesarse inmediatamente
        console.log(`[MainFlow]: Procesando comando de configuración inmediatamente`);
        return gotoFlow(configFlow);
      }

      // Mensaje buffeado, no hacer nada más (el timeout se encargará)
      console.log(`[MainFlow]: Mensaje buffeado, esperando más mensajes...`);
      
      // Opcional: Mostrar indicador de que está procesando
      // await flowDynamic('✍️ _Procesando..._');
      
    } catch (error) {
      console.error('[MainFlow]: Error en mainFlow:', error);
      await flowDynamic('Disculpa, hubo un error procesando tu mensaje. Intenta de nuevo.');
    }
  });

/**
 * Procesa los mensajes agrupados y decide a qué flow enviarlos
 */
async function processGroupedMessages(userId, groupedMessages, combinedText, { flowDynamic, gotoFlow, state }) {
  try {
    console.log(`[MainFlow]: Procesando ${groupedMessages.length} mensajes agrupados de ${userId}`);
    console.log(`[MainFlow]: Texto combinado: "${combinedText}"`);

    // Guardar mensajes agrupados en el estado para que los flows los puedan usar
    state.update({ 
      groupedMessages, 
      combinedText,
      messageCount: groupedMessages.length 
    });

    // Crear contexto simulado para el flow de destino
    const simulatedCtx = {
      body: combinedText,
      from: userId,
      messageType: groupedMessages[0].messageType || 'text',
      groupedMessages,
      originalMessages: groupedMessages
    };

    // Lógica de decisión de flow basada en el contenido combinado
    const lowerText = combinedText.toLowerCase();

    // Verificar si contiene comandos de configuración (empiezan con #)
    const hasConfigCommand = lowerText.startsWith('#') || 
                           lowerText.includes('#config') || 
                           lowerText.includes('#admin') || 
                           lowerText.includes('#bot');

    if (hasConfigCommand) {
      console.log(`[MainFlow]: Enviando a configFlow (contiene comando de configuración)`);
      return gotoFlow(configFlow);
    }

    // Por defecto, enviar al agentFlow con el contexto agrupado
    console.log(`[MainFlow]: Enviando a agentFlow con ${groupedMessages.length} mensajes agrupados`);
    return gotoFlow(agentFlow);

  } catch (error) {
    console.error('[MainFlow]: Error procesando mensajes agrupados:', error);
    await flowDynamic('Disculpa, hubo un error procesando tus mensajes. Intenta de nuevo.');
  }
}

/**
 * Función para obtener estadísticas del buffer (útil para debugging)
 */
export function getBufferStats() {
  return messageBuffer.getStats();
}

/**
 * Función para limpiar todos los buffers (útil para cleanup)
 */
export function clearAllBuffers() {
  messageBuffer.clearAll();
}

// export { mainFlow };