import { crawlAndStoreWebsite } from "../services/crawlService.js";
import meiliClient from "../config/meiliClient.js";

export const handlePreCrawl = async (req, res) => {
  const { url, websiteName } = req.body;

  if (!url || !websiteName) {
    return res.status(400).json({ error: "Both 'url' and 'websiteName' are required" });
  }

  try {
    const task = await meiliClient.createIndex(websiteName, { primaryKey: 'id' });
    await meiliClient.waitForTask(task.taskUid);

    await crawlAndStoreWebsite(url, websiteName);
    res.json({ message: `Website '${websiteName}' successfully crawled and stored.` });
  } catch (error) {
    console.error("Pre-crawl error:", error);
    res.status(500).json({ error: "Failed to pre-crawl the website." });
  }
};
