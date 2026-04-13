const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * AI Search Helper
 * Uses GPT-4o-mini to convert natural language queries into efficient tags/keywords.
 */
const parseSearchQuery = async (query) => {
  if (!query || query.length < 3) return query ? [query.toLowerCase()] : [];
  
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an AI search assistant for a media library. Your goal is to convert a natural language query into a comma-separated list of short, searchable keywords or tags. Extract subjects, colors, moods, and objects. Example: 'red flower in village evening' -> 'red, flower, village, evening, sunset, nature'. ONLY return the comma-separated list, nothing else."
        },
        {
          role: "user",
          content: query
        }
      ],
      temperature: 0.3
    });

    const result = response.choices[0].message.content
      .toLowerCase()
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    return result.length > 0 ? result : [query.toLowerCase()];

  } catch (err) {
    console.error("AI SEARCH ERROR:", err.message);
    // Fallback to simple word split if AI fails
    return query.toLowerCase().split(/\s+/).filter(k => k.length > 1);
  }
};

module.exports = { parseSearchQuery };
