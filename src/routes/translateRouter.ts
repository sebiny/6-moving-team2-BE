import { Router } from "express";
import { cacheMiddleware, redis } from "../middlewares/cacheMiddleware";

const translateRouter = Router();

translateRouter.post("/", cacheMiddleware(), async (req, res) => {
  try {
    const { text, targetLang } = req.body;

    if (!text || !targetLang) {
      return res.status(400).json({ error: "Missing text or targetLang" });
    }

    // Redis key 생성
    const cacheKey = `translation:${targetLang}:${text}`;

    // 1. 캐시 확인
    if (!redis) {
      throw new Error("Redis is not connected");
    }

    const cachedTranslation = await redis.get(cacheKey);
    if (cachedTranslation) {
      console.log("Cache hit", cachedTranslation);
      return res.json({ translation: cachedTranslation, cached: true });
    }
    console.log("Cache miss", cachedTranslation);
    // 2. DeepL API 호출
    const deeplApiKey = process.env.DEEPL_API_KEY;
    const deeplUrl = "https://api-free.deepl.com/v2/translate";

    const response = await fetch(deeplUrl, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${deeplApiKey}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        text,
        target_lang: targetLang
      })
    });

    if (!response.ok) {
      throw new Error(`DeepL API error: ${response.statusText}`);
    }

    const data = await response.json();
    const translation = data.translations?.[0]?.text;
    console.log("DeepL API response", translation);

    res.json({ translation });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

export default translateRouter;
