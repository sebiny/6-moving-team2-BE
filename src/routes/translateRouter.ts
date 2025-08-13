import { Router } from "express";
import Redis from "ioredis";

const translateRouter = Router();
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379
});

translateRouter.post("/", async (req, res) => {
  try {
    const { text, targetLang } = req.body;

    if (!text || !targetLang) {
      return res.status(400).json({ error: "Missing text or targetLang" });
    }

    // Redis key 생성
    const cacheKey = `translation:${targetLang}:${text}`;

    // 1. 캐시 확인
    const cachedTranslation = await redis.get(cacheKey);
    if (cachedTranslation) {
      return res.json({ translation: cachedTranslation, cached: true });
    }

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

    // 3. Redis 캐시 저장 (1시간)
    if (translation) {
      await redis.set(cacheKey, translation, "EX", 3600);
    }

    res.json({ translation, cached: false });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

export default translateRouter;
