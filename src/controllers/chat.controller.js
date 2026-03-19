const { chatService } = require('../services/chat.service');
const { getUploadedFile } = require('../middlewares/validate');

const createChat = async (req, res, next) => {
    try {
        const { message, conversationId } = req.body;
        const uploadedFile = getUploadedFile(req);
        const startTime = Date.now();

        const response = uploadedFile
            ? await chatService.handleDocumentChat({
                question: message,
                file: uploadedFile,
                conversationId,
            })
            : await chatService.handleChat(message, conversationId);

        const duration = Date.now() - startTime;
        
        res.status(200).json({
            ...response,
            metadata: {
                requestTime: duration,
                timestamp: new Date().toISOString(),
            }
        });
    } catch (error) {
        next(error);
    }
};

const askFromDocument = async (req, res, next) => {
    try {
        const uploadedFile = getUploadedFile(req);
        const startTime = Date.now();
        const response = await chatService.handleDocumentChat({
            question: req.body.message,
            file: uploadedFile,
            conversationId: req.body.conversationId,
        });
        const duration = Date.now() - startTime;

        res.status(200).json({
            ...response,
            metadata: {
                requestTime: duration,
                timestamp: new Date().toISOString(),
            },
        });
    } catch (error) {
        next(error);
    }
};

const listConversations = async (req, res, next) => {
    try {
        const { limit } = req.query;
        const items = await chatService.listConversationHistories(limit);
        res.status(200).json({
            items,
            count: items.length,
        });
    } catch (error) {
        next(error);
    }
};

const deleteConversation = async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const deleted = await chatService.deleteConversationHistory(conversationId);

        if (!deleted) {
            return res.status(404).json({
                error: true,
                message: 'Conversation not found',
                conversationId,
            });
        }

        return res.status(200).json({
            success: true,
            conversationId,
        });
    } catch (error) {
        next(error);
    }
};

const getConversationHistory = async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const history = await chatService.getConversationHistory(conversationId);
        if (!history) {
            return res.status(404).json({ 
                error: true,
                message: 'Conversation not found',
                conversationId 
            });
        }
        res.status(200).json({
            conversationId,
            messages: history,
            count: history.length
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { createChat, getConversationHistory, askFromDocument, listConversations, deleteConversation };