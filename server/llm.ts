import { choose, ADJECTIVES, ANIMALS } from "./server-shared";

// Let's import types or helpers
export async function generateGroqOrGeminiNickname(geminiAi: any): Promise<{ username: string; avatarSeed: string }> {
  const avatarSeed = `seed-${Math.floor(Math.random() * 1000)}`;
  const groqKey = process.env.GROQ_API_KEY;

  if (groqKey && !groqKey.includes("gsk_...")) {
    try {
      console.log("🤖 Querying Groq API for anonymous cover... 🔥");
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile", // High-tier standard Groq model
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `You are the name generator for "SyncUp", an anonymous supportive community platform.
Generate a single beautiful, soothing, and unique anonymous pseudonym/alias for a user.
Rules:
1. It must consist of check-in friendly adjectives and animals or items. Format: [Adjective][Animal or NaturalElement][3-digit random number] (e.g. WhisperPanda204 or SereneSprout773).
2. Use calming, safe, or peaceful words. Do not include spaces, special characters, or underscores.
3. Respond exclusively in standard JSON format containing keys: "username" (string limit 16 chars).`
            }
          ],
          temperature: 0.8
        })
      });

      if (res.ok) {
        const bodyObj = await res.json();
        const contentStr = bodyObj.choices?.[0]?.message?.content || "{}";
        const parsed = JSON.parse(contentStr.trim());
        if (parsed.username) {
          console.log("✅ Groq generated username successfully:", parsed.username);
          return { username: parsed.username, avatarSeed };
        }
      } else {
        console.warn("Groq network failed, status:", res.status);
      }
    } catch (error) {
      console.warn("Groq request threw error:", error);
    }
  }

  // Fallback to Gemini if configured
  if (geminiAi) {
    try {
      console.log("✨ Querying Gemini API for anonymous cover... 🪄");
      const response = await geminiAi.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `You are the name generator for "SyncUp", an anonymous supportive community platform.
Generate a single beautiful, soothing, and unique anonymous pseudonym/alias for a user.
Format output strictly as JSON with key "username" (e.g. WhisperPanda204).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            required: ["username"],
            properties: {
              username: { type: "STRING" }
            }
          }
        }
      });

      const text = response.text || "{}";
      const result = JSON.parse(text.trim());
      if (result.username) {
        return { username: result.username, avatarSeed };
      }
    } catch (gErr) {
      console.warn("Gemini username fallback failed:", gErr);
    }
  }

  // Absolute offline guarantee
  console.log("🍂 Local generator fallback in action");
  const adj = choose(ADJECTIVES);
  const anim = choose(ANIMALS);
  const num = Math.floor(100 + Math.random() * 900);
  return { username: `${adj}${anim}${num}`, avatarSeed };
}
