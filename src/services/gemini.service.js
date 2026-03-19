const axios = require('axios');

const GEMINI_MODEL = 'gemini-2.5-flash';

// Rough token counter: ~4 chars = 1 token
const estimateTokens = (messages) => {
    let totalChars = 0;
    messages.forEach(m => {
        if (m.parts && m.parts[0] && m.parts[0].text) {
            totalChars += m.parts[0].text.length;
        }
    });
    return Math.ceil(totalChars / 4);
};

const getAIResponse = async (messages) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    
    const inputTokens = estimateTokens(messages);
    console.log(`[Gemini] Sending request with ~${inputTokens} tokens in ${messages.length} messages`);

    try {
        const response = await axios.post(url, {
            contents: messages,
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000,
        });

        const candidate = response.data?.candidates?.[0];
        if (!candidate) throw new Error('No response from Gemini (empty candidates)');
        
        const replyText = candidate.content.parts[0].text;
        console.log(`[Gemini] Response: ~${Math.ceil(replyText.length / 4)} tokens`);
        return replyText;
    } catch (error) {
        if (error.response?.status === 429) {
            throw new Error('Rate limit exceeded. Try again in 1 minute.');
        }
        if (error.response?.data?.error) {
            throw new Error(`Gemini API: ${error.response.data.error.message}`);
        }
        throw error;
    }
};

const getAIResponseFromDocument = async ({ question, fileBuffer, mimeType, fileName }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    const fileBase64 = fileBuffer.toString('base64');

    console.log(`[Gemini] Doc query | file=${fileName} | mime=${mimeType} | sizeKB=${Math.ceil(fileBuffer.length / 1024)}`);

    const prompt = [
        'You are analyzing an uploaded document.',
        'Answer only based on the document content.',
        'If the answer is not in the document, say clearly that the document does not contain enough information.',
        `Question: ${question}`,
    ].join('\n');

    try {
        const response = await axios.post(url, {
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: prompt },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: fileBase64,
                            },
                        },
                    ],
                },
            ],
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 45000,
        });

        const candidate = response.data?.candidates?.[0];
        if (!candidate) throw new Error('No response from Gemini for document query');
        return candidate.content.parts[0].text;
    } catch (error) {
        if (error.response?.status === 429) {
            throw new Error('Rate limit exceeded. Try again in 1 minute.');
        }
        if (error.response?.data?.error) {
            throw new Error(`Gemini API: ${error.response.data.error.message}`);
        }
        throw error;
    }
};

module.exports = { getAIResponse, getAIResponseFromDocument };