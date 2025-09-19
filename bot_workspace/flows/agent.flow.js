import { addKeyword, EVENTS } from '@builderbot/bot';
import { runAgent } from '../ai_engine/agent_executor.js';
import { getProductContextData } from '../../api_server/src/services/product.service.js';

const agentFlow = addKeyword(EVENTS.WELCOME)
    .addAction(async (ctx, { flowDynamic }) => {
        try {
            console.log(`[USER]: agentFlow activado. Mensaje: "${ctx.body}"`);

            // 1. Obtener el contexto de productos
            const productContext = await getProductContextData();

            // 2. Formatear el contexto para pasarlo al agente
            const dynamicContext = `
                **Contexto de Inventario (Solo para tu conocimiento, no lo muestres al usuario):**
                - Tipos de producto: ${productContext.names.join(', ')}.
                - Categorías: ${productContext.categories.join(', ')}.
                - Colores: ${productContext.colors.join(', ')}.
                - Talles: ${productContext.sizes.join(', ')}.
            `;

            // 3. Llamar al agente con el contexto como un nuevo parámetro
            const aiResponse = await runAgent(ctx.body, ctx.history, dynamicContext);
            
            await flowDynamic(aiResponse);

        } catch (error) {
            console.error("[ERROR] en agentFlow:", error);
            await flowDynamic('En este momento tengo dificultades para procesar tu solicitud. Por favor, intenta de nuevo en unos minutos.');
        }
    });

export { agentFlow };
