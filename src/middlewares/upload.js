const multer = require('multer');

const MAX_FILE_SIZE_MB = 8;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

const allowedMimeTypes = new Set([
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/json',
    'text/csv',
]);

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype)) {
        return cb(null, true);
    }
    return cb(new Error(`Unsupported file type: ${file.mimetype}`));
};

const uploadDoc = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter,
});

module.exports = { uploadDoc, MAX_FILE_SIZE_MB };