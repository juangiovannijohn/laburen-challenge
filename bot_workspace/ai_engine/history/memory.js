export const formatHistoryForLLM = (builderbotHistory) => {
  if (!builderbotHistory || builderbotHistory.length === 0) {
    return [];
  }

  if (typeof builderbotHistory === 'string') {
    return JSON.parse(builderbotHistory);
  }

  let formattedHistory = [];
  if (Array.isArray(builderbotHistory)) {
    builderbotHistory.forEach((miniArray) => {
      const miniArrayParsed = JSON.parse(miniArray);

      formattedHistory.push({
        role: miniArrayParsed[0].role,
        content: miniArrayParsed[0].content,
      });
    });

    return formattedHistory;
  }
};
