import { extractKeyword } from "../services/aiService.js";
import { searchInIndex } from "../services/searchService.js";

export const handleSearch = async (req, res) => {
  const { prompt, websiteName } = req.body;

  if (!prompt || !websiteName) {
    return res.status(400).json({ error: "Prompt is required." });
  }
  if(!websiteName){
    return res.status(400).json({error : "Website Name is required."})
  }

  try {
    const keyword = await extractKeyword(prompt);
    const results = await searchInIndex(websiteName, keyword, prompt);
    res.json({ keyword, results });
  } catch (error) {
    console.error("Error in searching: ", error);
    res.status(500).json({ error: "An error occurred while processing the request." });
  }
};
