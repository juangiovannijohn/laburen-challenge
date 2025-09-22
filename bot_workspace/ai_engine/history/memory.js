// Este módulo se encarga de formatear el historial de conversación
// proporcionado por builderbot (ctx.history) al formato que espera el LLM (OpenAI).

export const formatHistoryForLLM = (builderbotHistory) => {
  if (!builderbotHistory || builderbotHistory.length === 0) {
    return [];
  }

  // builderbotHistory es un array de objetos con { role: 'user'/'assistant', content: '...' }
  // OpenAI espera { role: 'user'/'assistant', content: '...' }
  // Así que el formato ya es bastante compatible.
  // Podríamos añadir lógica para filtrar o resumir si el historial es muy largo.

  return builderbotHistory.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
};
