module.exports = (err, req, res, next) => {
    // Map error types to HTTP status codes
    let status = 500;
    let message = err.message || 'Internal Server Error';

    if (err.code === 'LIMIT_FILE_SIZE') {
        status = 413;
        message = 'File too large. Max file size is 8MB';
    } else if (message.includes('Unsupported file type')) {
        status = 400;
    } else if (message.includes('Rate limit')) {
        status = 429;
    } else if (message.includes('GEMINI_API_KEY')) {
        status = 500;
        message = 'API key not configured';
    } else if (message.includes('Invalid input') || message.includes('Message too long')) {
        status = 400;
    } else if (message.includes('Gemini API')) {
        status = 502; // Bad gateway
    }

    console.error(`[Error] ${status}: ${message}`);
    
    res.status(status).json({
        error: true,
        status,
        message,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};