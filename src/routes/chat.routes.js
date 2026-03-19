const express = require('express');
const { createChat, getConversationHistory, askFromDocument, listConversations, deleteConversation } = require('../controllers/chat.controller');
const { validateChatRequest, validateDocumentQuery } = require('../middlewares/validate');
const { uploadDoc } = require('../middlewares/upload');

const router = express.Router();

const uploadDocFields = uploadDoc.fields([
	{ name: 'file', maxCount: 1 },
	{ name: 'files', maxCount: 1 },
]);

router.post('/', uploadDocFields, validateChatRequest, createChat);
router.post('/docs', uploadDocFields, validateDocumentQuery, askFromDocument);
router.get('/', listConversations);
router.delete('/:conversationId', deleteConversation);
router.get('/:conversationId', getConversationHistory);

module.exports = router;