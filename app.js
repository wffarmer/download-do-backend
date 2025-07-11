const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("download.do backend is running");
});

app.post("/api/extract", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "No URL provided" });

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    const videoURL = await page.evaluate(() => {
      const sources = Array.from(document.querySelectorAll("source"));
      const best = sources.find(s => s.getAttribute("type") === "video/mp4");
      return best ? best.src : null;
    });

    const title = await page.title();
    await browser.close();

    if (!videoURL) return res.status(404).json({ error: "No video found" });

    res.json({ title, download_url: videoURL });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
