import Groq from "groq-sdk";

export const extractKeyword = async (prompt) => {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const response = await groq.chat.completions.create({
    messages: [
      { role: "system", content: "Extract the most relevant keyword or phrase from the user's prompt. Respond only with the keyword or phrase." },
      { role: "user", content: prompt },
    ],
    model: "llama3-8b-8192",
  });

  const keyword = response.choices[0]?.message?.content?.trim();
  if (!keyword) throw new Error("No keyword extracted.");
  return keyword;
};

export const analyzeContent = async (hit, keyword, prompt) => {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  let contentToAnalyze = hit.content.slice(0, 2000);
  const end = hit.content.indexOf(".", 2000);
  if (end !== -1 && end < 2200) {
    contentToAnalyze = hit.content.slice(0, end + 1);
  }

  const response = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a technical documentation assistant. Provide ONLY a valid JSON object in this format: {\"score\": <number between 0-10 with up to 2 decimal places>, \"relevantContent\": \"<summarize the most relevant technical answer, 100 words max>\"}"
      },
      {
        role: "user",
        content: `Analyze this content for relevance to keyword "${keyword}" and prompt "${prompt}". Content: ${contentToAnalyze}`
      }
    ],
    model: "llama3-8b-8192",
    temperature: 0.1,
  });

  const raw = response.choices[0]?.message?.content?.trim();
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No valid JSON in response.");

  const parsed = JSON.parse(match[0]);
  return {
    id: hit.id,
    url: hit.url,
    title: hit.title,
    score: parsed.score || 0,
    relevantContent: parsed.relevantContent || "No relevant content found.",
  };
};
