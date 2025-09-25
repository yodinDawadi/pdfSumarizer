export default async function handler(request, response) {
    const { text } = request.body;
    
    if (!text) {
        return response.status(400).json({ error: 'Text content is required.' });
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
        return response.status(500).json({ error: 'API key is not configured.' });
    }

    // The Gemini API URL for the model
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;
    
    const payload = {
        contents: [{
            parts: [{
                text: `Please provide a concise and well-structured summary of the following text:\n\n${text}`
            }]
        }]
    };

    try {
        // Use native fetch supported by Vercel's Node.js runtime
        const apiResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            throw new Error(`API call failed with status ${apiResponse.status}: ${errorText}`);
        }

        const result = await apiResponse.json();
        const summary = result?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!summary) {
            return response.status(500).json({ error: 'Failed to generate summary from the API.' });
        }

        return response.status(200).json({ summary });

    } catch (error) {
        console.error('Serverless function error:', error);
        return response.status(500).json({ error: 'Internal server error during summarization.' });
    }
}
