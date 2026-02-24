const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Memory storage
const storage = multer.memoryStorage();

// File filter for documents
const documentFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlform'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, and PNG allowed'), false);
    }
};

// File filter for photos
const photoFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images allowed.'), false);
    }
};

// Multer upload middleware
const uploadDocument = multer({
    storage: storage,
    fileFilter: documentFilter,
    limits: { fileSize: 10 * 1024 * 1024 }
});

const uploadPhoto = multer({
    storage: storage,
    fileFilter: photoFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = {
    cloudinary,
    uploadDocument,
    uploadPhoto
};