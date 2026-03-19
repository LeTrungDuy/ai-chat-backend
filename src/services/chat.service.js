const { v4: uuidv4 } = require('uuid');
const { getAIResponse, getAIResponseFromDocument } = require('./gemini.service');
const dbService = require('./db.service');

// CONFIG: Token & history optimization
const MAX_HISTORY = 10;        // Only send last 10 messages to API
const MAX_MESSAGE_LENGTH = 2000; // 2KB max per message
const MAX_TITLE_LENGTH = 120;

const chatService = {
    async createConversation(initialMessage) {
        const id = uuidv4();
        const title = String(initialMessage || 'New chat').trim().slice(0, MAX_TITLE_LENGTH) || 'New chat';
        await dbService.createConversation({ id, title });
        return id;
    },

    async getConversationHistory(conversationId) {
        const conversation = await dbService.getConversationById(conversationId);
        if (!conversation) return null;

        const messages = await dbService.getConversationHistory(conversationId);
        return messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            content: m.content,
            createdAt: m.createdAt,
        }));
    },

    async listConversationHistories(limit) {
        const rows = await dbService.listConversations(limit);
        return rows.map(row => ({
            conversationId: row.id,
            title: row.title,
            lastMessage: row.lastMessage,
            lastRole: row.lastRole === 'assistant' ? 'model' : row.lastRole,
            lastMessageAt: row.lastMessageAt,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        }));
    },

    async deleteConversationHistory(conversationId) {
        const affectedRows = await dbService.deleteConversation(conversationId);
        return affectedRows > 0;
    },

    async handleChat(message, conversationId) {
        // Validate message
        if (message.length > MAX_MESSAGE_LENGTH) {
            throw new Error(`Message too long (max ${MAX_MESSAGE_LENGTH} chars)`);
        }

        const existingConversation = conversationId
            ? await dbService.getConversationById(conversationId)
            : null;

        if (!existingConversation) {
            conversationId = await this.createConversation(message);
        }

        await dbService.saveMessage({
            conversationId,
            role: 'user',
            content: message,
        });

        const recentMessages = await dbService.getRecentMessages({
            conversationId,
            limit: MAX_HISTORY,
        });

        const toSend = recentMessages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        }));
        
        console.log(`[Chat] Conv: ${conversationId.slice(0, 8)}... | Sending: ${toSend.length}`);
        
        const aiText = await getAIResponse(toSend);

        await dbService.saveMessage({
            conversationId,
            role: 'assistant',
            content: aiText,
        });

        return { conversationId, reply: aiText };
    },

    async handleDocumentChat({ question, file, conversationId }) {
        const existingConversation = conversationId
            ? await dbService.getConversationById(conversationId)
            : null;

        if (!existingConversation) {
            conversationId = await this.createConversation(question);
        }

        const answer = await getAIResponseFromDocument({
            question,
            fileBuffer: file.buffer,
            mimeType: file.mimetype,
            fileName: file.originalname,
        });

        await dbService.saveMessage({
            conversationId,
            role: 'user',
            content: `[DOC:${file.originalname}] ${question}`,
        });

        await dbService.saveMessage({
            conversationId,
            role: 'assistant',
            content: answer,
        });

        return {
            conversationId,
            fileName: file.originalname,
            mimeType: file.mimetype,
            reply: answer,
        };
    },
};

module.exports = { chatService };