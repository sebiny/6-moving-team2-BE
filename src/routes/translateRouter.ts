import { Router } from "express";

const translateRouter = Router();

translateRouter.post("/", async (req, res) => {
  try {
    console.log("Translation request received:", {
      body: req.body,
      headers: req.headers,
      url: req.url,
      method: req.method
    });

    const { text, targetLang } = req.body;

    if (!text || !targetLang) {
      console.log("Missing required fields:", { text: !!text, targetLang: !!targetLang });
      return res.status(400).json({ error: "Missing text or targetLang" });
    }

    // DeepL API 호출
    const deeplApiKey = process.env.DEEPL_API_KEY;
    console.log("DeepL API key exists:", !!deeplApiKey);
    console.log("Environment variables check:", {
      NODE_ENV: process.env.NODE_ENV,
      DEEPL_API_KEY: deeplApiKey ? "SET" : "NOT_SET"
    });

    if (!deeplApiKey) {
      console.error("DeepL API key is not configured");
      throw new Error("DeepL API key is not configured");
    }

    // API 키에 따라 엔드포인트 결정 (free 또는 pro)
    const isFreeKey = deeplApiKey.endsWith(":fx");
    const deeplUrl = isFreeKey ? "https://api-free.deepl.com/v2/translate" : "https://api.deepl.com/v2/translate";
    console.log("DeepL URL:", deeplUrl, "Is free key:", isFreeKey);

    const requestBody = new URLSearchParams({
      text,
      target_lang: targetLang
    });

    console.log("DeepL API request:", {
      url: deeplUrl,
      method: "POST",
      body: requestBody.toString(),
      apiKeyPrefix: deeplApiKey.substring(0, 10) + "..."
    });

    const response = await fetch(deeplUrl, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${deeplApiKey}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: requestBody
    });

    console.log("DeepL API response status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepL API Error:", {
        status: response.status,
        statusText: response.statusText,
        errorText,
        apiKey: deeplApiKey ? `${deeplApiKey.substring(0, 10)}...` : "undefined"
      });
      throw new Error(`DeepL API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("DeepL API response data:", data);

    const translation = data.translations?.[0]?.text;
    console.log("Extracted translation:", translation);

    res.json({ translation, cached: false });
  } catch (error: any) {
    console.error("Translation error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default translateRouter;
