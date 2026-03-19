require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const chatRoutes = require('./routes/chat.routes');
const errorHandler = require('./middlewares/errorHandler');
const dbService = require('./services/db.service');

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

// Middleware
app.use(cors({
    origin(origin, callback) {
        // Allow requests with no origin (Postman, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(bodyParser.json({ limit: '10kb' })); // Limit payload to 10KB
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/chat', chatRoutes);

// Error handling
app.use(errorHandler);

const startServer = async () => {
    try {
        await dbService.initDatabase();
        console.log('[✓] Database schema ready');

        app.listen(PORT, () => {
            console.log(`\n[✓] Server running on http://localhost:${PORT}`);
            console.log(`[✓] Env: NODE_ENV=${process.env.NODE_ENV || 'development'}`);
            console.log(`[✓] CORS_ORIGIN=${allowedOrigins.join(', ')}`);
            console.log(`[✓] API Key: ${process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET'}`);
            console.log('[✓] Persistence: MySQL enabled');
            console.log(`[✓] Ready to handle requests\n`);
        });
    } catch (error) {
        console.error('[x] Failed to initialize server:', error.message);
        process.exit(1);
    }
};

startServer();