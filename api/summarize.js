export default async function handler(request, response) {
  try {
    // Check HTTP method
    if (request.method !== "POST") {
      return response.status(405).json({ error: "Only POST requests allowed." });
    }

    const { text } = request.body;
    if (!text || typeof text !== "string") {
      return response.status(400).json({ error: "Text content is required." });
    }

    // Ensure API key is available
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return response
        .status(500)
        .json({ error: "API key is not configured in environment variables." });
    }

    // --- SAFEGUARD: Trim or chunk very large text ---
    let safeText = text;
    const MAX_CHARS = 8000; // keep under Gemini’s input limit
    if (safeText.length > MAX_CHARS) {
      safeText = safeText.slice(0, MAX_CHARS);
    }

    // ✅ Use stable Gemini model
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const payload = {
      contents: [
        {
          parts: [
            {
              text: `Please provide a **concise and well-structured summary** of the following text:\n\n${safeText}`,
            },
          ],
        },
      ],
    };

    // Call Gemini API
    const apiResponse = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      throw new Error(
        `Gemini API failed with status ${apiResponse.status}: ${errorText}`
      );
    }

    const result = await apiResponse.json();

    // ✅ Flexible parsing (Gemini can return 2 formats)
    const summary =
      result?.candidates?.[0]?.content?.parts?.[0]?.text ||
      result?.candidates?.[0]?.content?.[0]?.parts?.[0]?.text;

    if (!summary) {
      return response
        .status(500)
        .json({ error: "Failed to extract summary from Gemini response." });
    }

    return response.status(200).json({ summary });
  } catch (error) {
    console.error("Serverless function error:", error);
    return response
      .status(500)
      .json({ error: "Internal server error during summarization." });
  }
}
