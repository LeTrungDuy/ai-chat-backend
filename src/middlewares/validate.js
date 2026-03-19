const MAX_MESSAGE_LENGTH = 2000;

const getUploadedFile = (req) => {
    if (req.file) return req.file;
    if (req.files?.file?.[0]) return req.files.file[0];
    if (req.files?.files?.[0]) return req.files.files[0];
    return null;
};

const validateMessage = (req, res, next) => {
    const { message } = req.body;
    
    if (!message || typeof message !== 'string' || message.trim() === '') {
        return res.status(400).json({ 
            error: 'Invalid input',
            message: 'message is required and cannot be empty' 
        });
    }
    
    if (message.length > MAX_MESSAGE_LENGTH) {
        return res.status(400).json({ 
            error: 'Message too long',
            message: `Max ${MAX_MESSAGE_LENGTH} characters. Got ${message.length}.` 
        });
    }
    
    next();
};

const validateDocumentQuery = (req, res, next) => {
    const { message } = req.body;
    const uploadedFile = getUploadedFile(req);

    if (!uploadedFile) {
        return res.status(400).json({
            error: 'Invalid input',
            message: 'file is required (multipart/form-data field name: file or files)',
        });
    }

    if (!uploadedFile.size) {
        return res.status(400).json({
            error: 'Invalid input',
            message: 'uploaded file is empty',
        });
    }

    if (!message || typeof message !== 'string' || message.trim() === '') {
        return res.status(400).json({
            error: 'Invalid input',
            message: 'message is required and cannot be empty',
        });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
        return res.status(400).json({
            error: 'Message too long',
            message: `Max ${MAX_MESSAGE_LENGTH} characters. Got ${message.length}.`,
        });
    }

    next();
};

const validateChatRequest = (req, res, next) => {
    const uploadedFile = getUploadedFile(req);
    if (uploadedFile) {
        return validateDocumentQuery(req, res, next);
    }
    return validateMessage(req, res, next);
};

module.exports = { validateMessage, validateDocumentQuery, validateChatRequest, getUploadedFile };