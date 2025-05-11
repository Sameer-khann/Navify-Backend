import { chromium } from "playwright";
import path from "path";
import fs from "fs/promises";

export const crawlAndStoreWebsite = async (url, websiteName) => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const visited = new Set();
  const pages = [];

  const crawl = async (url, depth = 1) => {
    if (depth > 3 || visited.has(url)) return;
    visited.add(url);

    try {
      await page.goto(url);
      const title = await page.title();
      const content = await page.evaluate(() => {
        const element = document.querySelectorAll('p,h1,h2,h3,h4,h5,h6,article,section');
        return Array.from(element).map(el => el.textContent.trim()).join('\n')
      });

      pages.push({ id: pages.length + 1 + "", url, title, content });

      const links = await page.$$eval("a", as => as.map(a => a.href).filter(href => href.startsWith("http")));
      for (const link of links){
        await crawl(link, depth + 1);
      }
    } catch (err) {
      console.error(`Failed to crawl ${url}:`, err.message);
    }
  };

  await crawl(url);
  await browser.close();

  const outPath = path.join("./data", `${websiteName}.json`);
  await fs.writeFile(outPath, JSON.stringify(pages, null, 2));
  console.log(`Data saved to ${outPath}`);
};
