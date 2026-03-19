require('dotenv').config();

const config = {
    geminiApiKey: process.env.GEMINI_API_KEY,
    port: process.env.PORT || 3000,
};

module.exports = config;