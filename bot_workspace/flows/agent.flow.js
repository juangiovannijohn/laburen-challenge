import { addKeyword, EVENTS } from '@builderbot/bot';
import { runAgent } from '../ai_engine/agent_executor.js';
import { getProductContextData } from '../../api_server/src/services/product.service.js';
import SupabaseDB from '../../database/supabase.adapter.js';

const agentFlow = addKeyword(EVENTS.WELCOME).addAction(async (ctx, { flowDynamic, state }) => {
  try {
    // Obtener mensajes agrupados del estado si existen
    const groupedMessages = state.get('groupedMessages') || []; // TODO se podria eliminar, sirve solo de debug
    const combinedText = state.get('combinedText') || ctx.body;
    const messageCount = state.get('messageCount') || 1; // TODO se podria eliminar, sirve solo de debug

    console.log(`[USER]: agentFlow activado. Procesando ${messageCount} mensaje(s)`);
    console.log(`[USER]: Texto combinado: "${combinedText}"`);
    
    if (groupedMessages.length > 1) {
      console.log(`[USER]: Mensajes individuales:`, groupedMessages.map(m => m.body));
    }

    const productContext = await getProductContextData();

    const dynamicContext = `
                **Contexto de Inventario (Solo para tu conocimiento, no lo muestres al usuario):**
                - Tipos de producto: ${productContext.names.join(', ')}.
                - Categorías: ${productContext.categories.join(', ')}.
                - Colores: ${productContext.colors.join(', ')}.
                - Talles: ${productContext.sizes.join(', ')}.
            `;

    const db = new SupabaseDB();
    const history = (await db.get(ctx.from)) || [];
    ctx.history = history;

    // Usar el texto combinado para el procesamiento del AI
    const aiResponse = await runAgent(combinedText, ctx.history, dynamicContext);
    await flowDynamic(aiResponse);

    // // Respuesta temporal que indica que se procesaron mensajes agrupados
    // let response = 'Soy tu asistente de ventas. Puedo ayudarte a:\n\n' +
    //   '- **Buscar productos:** Encuentra lo que necesitas en nuestro catálogo, ya sea por nombre, tipo de prenda, talla, color o categoría.\n' +
    //   '- **Ver detalles de productos:** Si tienes el ID de un producto, puedo darte toda su información.\n' +
    //   '- **Gestionar tu carrito de compras:** Puedes crear un carrito, añadir productos, modificar cantidades o eliminar ítems.\n\n' +
    //   '¿En qué puedo ayudarte hoy?';

    // await flowDynamic(response);

  } catch (error) {
    console.error('[ERROR] en agentFlow:', error);
    await flowDynamic(
      'En este momento tengo dificultades para procesar tu solicitud. Por favor, intenta de nuevo en unos minutos.'
    );
  }
});

export { agentFlow };
