import meiliClient from "../config/meiliClient.js";
import { analyzeContent } from "./aiService.js";

export const searchInIndex = async (websiteName, keyword, prompt) => {
  const index = meiliClient.index(websiteName);
  const { hits } = await index.search(keyword, {
    limit: 20,
    attributesToRetrieve: ["id", "url", "title", "content"],
  });

  const analyzed = await Promise.all(
    hits.map(hit => analyzeContent(hit, keyword, prompt))
  );

  return analyzed.sort((a, b) => b.score - a.score).slice(0, 3);
};
