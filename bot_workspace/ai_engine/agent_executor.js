import { openai, LLM_MODEL } from './llm/client.js';
import SYSTEM_PROMPT from './prompts/system_prompt.js';
import { toolsDefinitions, toolsImplementations } from './tools/index.js';
import { formatHistoryForLLM } from './history/memory.js';

export const runAgent = async (userInput, builderbotHistory, dynamicContext = '') => {
  try {
    const formattedHistory = formatHistoryForLLM(builderbotHistory);
    const finalSystemPrompt = `${dynamicContext}\n\n${SYSTEM_PROMPT}`;

    console.log('[AGENT]: Iniciando runAgent...');
    const messages = [
      { role: 'system', content: finalSystemPrompt },
      ...formattedHistory,
      { role: 'user', content: userInput },
    ];

    //TODO. utilizar nueva API
    const response = await openai.chat.completions.create({
      model: LLM_MODEL,
      messages: messages,
      tools: toolsDefinitions,
      tool_choice: 'auto',
    });

    const responseMessage = response.choices[0].message;

    // Necesita tools
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0]; // Asumimos una sola llamada a herramienta por turno
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      if (toolsImplementations[functionName] && typeof toolsImplementations[functionName] === 'function') {
        console.log(`[AGENT]: Llamando a la herramienta: ${functionName} con argumentos:`, functionArgs);
        const availableFunction = toolsImplementations[functionName];

        const result = await availableFunction(functionArgs);

        // Error en la tool
        if (typeof result === 'string' && result.startsWith('Error:')) {
          console.error(`[AGENT]: Error en la herramienta ${functionName}: ${result}`);
          return result;
        }

        // Añadir la respuesta de la herramienta a los mensajes para la siguiente llamada al LLM
        messages.push(responseMessage); // Mensaje original
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

        return secondResponse.choices[0].message.content;
      } else {
        return `Error: El LLM intentó llamar a una herramienta no disponible: ${functionName}`;
      }
    } else {
      // El LLM respondió directamente con texto
      return responseMessage.content;
    }
  } catch (error) {
    console.error('[AGENT]: Error en runAgent:', error);
    return `Error: Ha ocurrido un error inesperado en el agente. Detalles: ${error.message}`;
  }
};
