export const formatHistoryForLLM = (builderbotHistory) => {
  if (!builderbotHistory || builderbotHistory.length === 0) {
    return [];
  }

  let formattedHistory = [];

  if (typeof builderbotHistory[0] === 'string') {
    builderbotHistory.forEach((jsonString) => {
      try {
        const parsed = JSON.parse(jsonString);

        if (Array.isArray(parsed)) {
          formattedHistory = formattedHistory.concat(parsed);
        } else if (typeof parsed === 'object') {
          formattedHistory.push(parsed);
        }
      } catch (error) {
        console.error('[ERROR] Parseando entrada de historial:', error, jsonString);
      }
    });
  } else {
    formattedHistory = builderbotHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  return formattedHistory;
};
