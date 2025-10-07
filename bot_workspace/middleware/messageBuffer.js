/**
 * Middleware para agrupar mensajes del usuario en un período de tiempo
 * Evita respuestas múltiples cuando el usuario envía varios mensajes seguidos
 */

class MessageBuffer {
  constructor(delayMs = 2000) {
    this.buffers = new Map(); // userId -> {messages: [], timeout: timeoutId, startTime: number}
    this.delay = delayMs;
    this.processingCallback = null;
  }

  /**
   * Configura el callback que procesará los mensajes agrupados
   * @param {Function} callback - Función que recibe (userId, groupedMessages, combinedText)
   */
  setProcessingCallback(callback) {
    this.processingCallback = callback;
  }

  /**
   * Agrega un mensaje al buffer del usuario
   * @param {string} userId - ID del usuario
   * @param {Object} message - Objeto del mensaje con propiedades como body, messageType, etc.
   * @returns {boolean} - true si el mensaje fue buffeado, false si debe procesarse inmediatamente
   */
  addMessage(userId, message) {
    // Verificar si es un saludo (no buffear saludos)
    const greetings = ['hola', 'buenas', 'hey', 'buenos dias', 'buenas tardes'];
    const isGreeting = greetings.some(greeting => 
      message.body.toLowerCase().includes(greeting.toLowerCase())
    );

    if (isGreeting) {
      console.log(`[MessageBuffer]: Saludo detectado, no buffeando: "${message.body}"`);
      return false; // No buffear, procesar inmediatamente
    }

    // Si no existe buffer para este usuario, crearlo
    if (!this.buffers.has(userId)) {
      this.buffers.set(userId, { 
        messages: [], 
        timeout: null, 
        startTime: Date.now() 
      });
    }

    const buffer = this.buffers.get(userId);
    
    // Agregar mensaje al buffer
    const messageData = {
      body: message.body,
      messageType: message.messageType || 'text',
      timestamp: Date.now(),
      mediaUrl: message.mediaUrl || null,
      from: message.from
    };
    
    buffer.messages.push(messageData);
    console.log(`[MessageBuffer]: Mensaje agregado al buffer de ${userId}. Total: ${buffer.messages.length}`);
    
    // Cancelar timeout anterior si existe
    if (buffer.timeout) {
      clearTimeout(buffer.timeout);
    }
    
    // Crear nuevo timeout
    buffer.timeout = setTimeout(() => {
      this.processBuffer(userId);
    }, this.delay);
    
    return true; // Mensaje buffeado
  }

  /**
   * Procesa todos los mensajes del buffer de un usuario
   * @param {string} userId - ID del usuario
   */
  async processBuffer(userId) {
    const buffer = this.buffers.get(userId);
    if (!buffer || buffer.messages.length === 0) {
      return;
    }

    const allMessages = [...buffer.messages];
    const combinedText = allMessages.map(m => m.body).join(' ');
    
    console.log(`[MessageBuffer]: Procesando ${allMessages.length} mensajes de ${userId}`);
    console.log(`[MessageBuffer]: Texto combinado: "${combinedText}"`);
    
    // Limpiar buffer
    this.buffers.delete(userId);
    
    // Llamar al callback de procesamiento si está configurado
    if (this.processingCallback) {
      try {
        await this.processingCallback(userId, allMessages, combinedText);
      } catch (error) {
        console.error('[MessageBuffer]: Error en callback de procesamiento:', error);
      }
    }
  }

  /**
   * Fuerza el procesamiento inmediato de un buffer
   * @param {string} userId - ID del usuario
   */
  async forceProcess(userId) {
    const buffer = this.buffers.get(userId);
    if (buffer && buffer.timeout) {
      clearTimeout(buffer.timeout);
      await this.processBuffer(userId);
    }
  }

  /**
   * Limpia todos los buffers (útil para cleanup)
   */
  clearAll() {
    for (const [userId, buffer] of this.buffers.entries()) {
      if (buffer.timeout) {
        clearTimeout(buffer.timeout);
      }
    }
    this.buffers.clear();
    console.log('[MessageBuffer]: Todos los buffers limpiados');
  }

  /**
   * Obtiene estadísticas de los buffers activos
   */
  getStats() {
    const stats = {
      activeBuffers: this.buffers.size,
      totalMessages: 0,
      bufferDetails: []
    };

    for (const [userId, buffer] of this.buffers.entries()) {
      stats.totalMessages += buffer.messages.length;
      stats.bufferDetails.push({
        userId,
        messageCount: buffer.messages.length,
        age: Date.now() - buffer.startTime
      });
    }

    return stats;
  }
}

export default MessageBuffer;