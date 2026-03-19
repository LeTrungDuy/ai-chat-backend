const mysql = require('mysql2/promise');

let pool;

const getPoolConfig = () => {
    if (process.env.DATABASE_URL) {
        return process.env.DATABASE_URL;
    }

    return {
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT || 3307),
        user: process.env.DB_USER || 'user',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'chat_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    };
};

const getPool = () => {
    if (!pool) {
        pool = mysql.createPool(getPoolConfig());
    }
    return pool;
};

const initDatabase = async () => {
    const db = getPool();

    await db.query(`
        CREATE TABLE IF NOT EXISTS conversations (
            id VARCHAR(36) PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS messages (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            conversation_id VARCHAR(36) NOT NULL,
            role ENUM('user', 'assistant') NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_messages_conversation_created (conversation_id, created_at),
            CONSTRAINT fk_messages_conversation
                FOREIGN KEY (conversation_id) REFERENCES conversations(id)
                ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
};

const createConversation = async ({ id, title }) => {
    const db = getPool();
    await db.query(
        'INSERT INTO conversations (id, title) VALUES (?, ?)',
        [id, title],
    );
};

const getConversationById = async (conversationId) => {
    const db = getPool();
    const [rows] = await db.query(
        'SELECT id, title, created_at AS createdAt, updated_at AS updatedAt FROM conversations WHERE id = ? LIMIT 1',
        [conversationId],
    );
    return rows[0] || null;
};

const saveMessage = async ({ conversationId, role, content }) => {
    const db = getPool();
    await db.query(
        'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)',
        [conversationId, role, content],
    );
    await db.query(
        'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [conversationId],
    );
};

const getRecentMessages = async ({ conversationId, limit }) => {
    const db = getPool();
    const [rows] = await db.query(
        `SELECT role, content, created_at AS createdAt
         FROM messages
         WHERE conversation_id = ?
         ORDER BY created_at DESC, id DESC
         LIMIT ?`,
        [conversationId, limit],
    );

    return rows.reverse();
};

const getConversationHistory = async (conversationId) => {
    const db = getPool();
    const [rows] = await db.query(
        `SELECT role, content, created_at AS createdAt
         FROM messages
         WHERE conversation_id = ?
         ORDER BY created_at ASC, id ASC`,
        [conversationId],
    );
    return rows;
};

const listConversations = async (limit = 50) => {
    const safeLimit = Number.isFinite(Number(limit)) ? Math.min(Math.max(Number(limit), 1), 100) : 50;
    const db = getPool();

    const [rows] = await db.query(
        `SELECT
            c.id,
            c.title,
            c.created_at AS createdAt,
            c.updated_at AS updatedAt,
            m.content AS lastMessage,
            m.role AS lastRole,
            m.created_at AS lastMessageAt
         FROM conversations c
         LEFT JOIN messages m
            ON m.id = (
                SELECT m2.id
                FROM messages m2
                WHERE m2.conversation_id = c.id
                ORDER BY m2.created_at DESC, m2.id DESC
                LIMIT 1
            )
         ORDER BY c.updated_at DESC
         LIMIT ?`,
        [safeLimit],
    );

    return rows;
};

const deleteConversation = async (conversationId) => {
    const db = getPool();
    const [result] = await db.query(
        'DELETE FROM conversations WHERE id = ?',
        [conversationId],
    );
    return result.affectedRows;
};

module.exports = {
    initDatabase,
    createConversation,
    getConversationById,
    saveMessage,
    getRecentMessages,
    getConversationHistory,
    listConversations,
    deleteConversation,
};