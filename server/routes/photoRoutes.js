const express = require("express");
const router = express.Router();
const {
    uploadPhoto,
    getPhoto,
    getPhotos,
    deletePhoto
} = require("../controllers/photoController");
const { protect } = require("../middleware/authMiddleware");
const { uploadPhoto: upload } = require("../config/cloudinary");

// Handle multer errors
const handleMulterError = (err, req, res, next) => {
    if (err) {
        return res.status(400).json({
            message: err.message || 'File upload error'
        });
    }
    next();
};

router.post('/upload', protect, upload.single('file'), handleMulterError, uploadPhoto);
router.get('/', protect, getPhotos);
router.get("/:id", protect, getPhoto);
router.delete('/:id', protect, deletePhoto);

module.exports = router;