import { openai, LLM_MODEL } from './llm/client.js';
import SYSTEM_PROMPT from './prompts/system_prompt.js';
import { toolsDefinitions, toolsImplementations } from './tools/index.js';
import { formatHistoryForLLM } from './history/memory.js';

export const runAgent = async (userInput, builderbotHistory, dynamicContext = '') => {
  try {
    console.log('[AGENT]: runAgent - dynamicContext:', dynamicContext);
    // 1. Formatear el historial para el LLM
    const formattedHistory = formatHistoryForLLM(builderbotHistory);

    // 2. Construir los mensajes para la API de OpenAI
    const finalSystemPrompt = `${dynamicContext}\n\n${SYSTEM_PROMPT}`;
    console.log('[AGENT]: runAgent - finalSystemPrompt:', finalSystemPrompt);
    const messages = [
      { role: 'system', content: finalSystemPrompt },
      ...formattedHistory,
      { role: 'user', content: userInput },
    ];

    // 3. Llamar a la API de OpenAI con las herramientas disponibles
    const response = await openai.chat.completions.create({
      model: LLM_MODEL,
      messages: messages,
      tools: toolsDefinitions, // Pasar las definiciones de las herramientas
      tool_choice: 'auto', // Permitir que el LLM decida si usar una herramienta
    });

    const responseMessage = response.choices[0].message;

    // 4. Manejar la respuesta del LLM
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0]; // Asumimos una sola llamada a herramienta por turno
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      if (toolsImplementations[functionName] && typeof toolsImplementations[functionName] === 'function') {
        console.log(`[AGENT]: Llamando a la herramienta: ${functionName} con argumentos:`, functionArgs);
        const availableFunction = toolsImplementations[functionName];

        // Ejecutar la herramienta, pasando los argumentos directamente
        const result = await availableFunction(functionArgs); // Pasar el objeto de argumentos completo

        // Si la herramienta devuelve un error, el LLM debe manejarlo
        if (typeof result === 'string' && result.startsWith('Error:')) {
          console.error(`[AGENT]: Error en la herramienta ${functionName}: ${result}`);
          return result; // Devolver el error para que el LLM lo procese
        }

        // Añadir la respuesta de la herramienta a los mensajes para la siguiente llamada al LLM
        messages.push(responseMessage); // El mensaje original del LLM que pidió la herramienta
        messages.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          content: JSON.stringify(result), // La respuesta de la herramienta
        });

        // Hacer una segunda llamada al LLM para obtener la respuesta final
        const secondResponse = await openai.chat.completions.create({
          model: LLM_MODEL,
          messages: messages,
        });

        return secondResponse.choices[0].message.content; // Devolver la respuesta final del LLM
      } else {
        return `Error: El LLM intentó llamar a una herramienta no disponible: ${functionName}`;
      }
    } else {
      // El LLM respondió directamente con texto
      return responseMessage.content;
    }
  } catch (error) {
    console.error('[AGENT]: Error en runAgent:', error);
    // Si hay un error inesperado, devolver un mensaje genérico para que el LLM lo maneje
    return `Error: Ha ocurrido un error inesperado en el agente. Detalles: ${error.message}`;
  }
};
