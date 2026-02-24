const express = require("express");
const router = express.Router();
const {
    uploadDocument,
    getDocument,
    getDocuments,
    deleteDocument,
    generateReport
} = require("../controllers/documentController");
const { protect } = require("../middleware/authMiddleware");
const { uploadDocument: upload } = require("../config/cloudinary");

// Handle multer errors
const handleMulterError = (err, req, res, next) => {
    if (err) {
        return res.status(400).json({
            message: err.message || 'File upload error'
        });
    }
    next();
};

router.get('/generate-report', protect, generateReport);
router.post('/upload', protect, upload.single('file'), handleMulterError, uploadDocument);
router.get('/', protect, getDocuments);
router.get('/:id', protect, getDocument);
router.delete('/:id', protect, deleteDocument);

module.exports = router;