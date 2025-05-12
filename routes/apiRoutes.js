import express from "express";
import { handlePreCrawl } from "../controllers/crawlcontroller.js";
import { handleSearch } from "../controllers/searchController.js";

const router = express.Router();

router.post("/pre-crawl", handlePreCrawl);
router.post("/navify", handleSearch);

export default router;