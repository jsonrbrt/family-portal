const Photo = require("../models/Photo");
const Album = require("../models/Album");
const { cloudinary } = require("../config/cloudinary");

// desc Upload a photo
// route POST /api/photos/upload
// access Private

const uploadPhoto = async(req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        // Validate file is an image
        if (!req.file.mimetype.startsWith('image/')) {
            return res.status(400).json({ message: 'Please upload an image file (JPG or PNG)'});
        }

        // Validate file size
        if (req.file.size > 5 * 1024 * 1024) {
            return res.status(400).json({ message: 'Photo size must be less than 5MB'});
        }

        // Validate user is part of a a family
        if(!req.user.family) {
            return res.status(400).json({ message: 'You must be a part of a family to upload photos' });
        }

        const { name, caption, albumId, tags, dateTaken } = req.body;

        // Validate name
        if (name && name.length > 200) {
            return res.status(400).json({ message: 'Photo name must be less than 200 characters' });
        }

        // Validate caption
        if (caption && caption.length > 500) {
            return res.status(400).json({ message: 'Caption must be less than 500 characters' });
        }

        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'family-portal/photos',
                    resource_type: 'image',
                    transformation: [
                        { width: 2000, crop: 'limit' },
                        { quality: 'auto' }
                    ]
                },
                (error, result) => {
                    if(error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(req.file.buffer);
        });

        // Create thumbnail
        const thumbnail = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'family-portal/thumbnails',
                    resource_type: 'image',
                    transformation: [
                        { width: 300, height: 300, crop: 'fill' },
                        { quality: 'auto' }
                    ]
                },
                (error, result) => {
                    if(error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(req.file.buffer);
        });

        // Create photo in database
        const photo = await Photo.create({
            name: name || req.file.originalname,
            caption,
            imageURL: result.secure_url,
            thumbnailURL: thumbnail.secure_url,
            uploadedBy: req.user._id,
            family: req.user.family._id,
            album: albumId || null,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            dateTaken: dateTaken || null
        });

        // If album specified, add photo to album
        if (albumId) {
            await Album.findByIdAndUpdate(albumId, {
                $push: { photos: photo._id }
            });
        }

        res.status(201).json({
            message: 'Photo uploaded successfully',
            photo
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// desc Get all photos for user's family
// route GET /api/photos
// access Private

const getPhotos = async(req, res) => {
    try {
        if(!req.user.family) {
            return res.status(400).json({ message: 'You must be a part of a family' });
        }

        const { albumId, search } = req.query;

        let query = { family: req.user.family._id };

        if(albumId) {
            query.album = albumId;
        }

        if(search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { caption: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        const photos = await Photo.find(query)
        .populate('uploadedBy', 'name email')
        .populate('album', 'name')
        .sort({ createdAt: -1 });

        res.json(photos);
    } catch(error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// desc Get single photo
// route GET /api/photos/:id
// access Private

const getPhoto = async(req, res) => {
    try {
        const photo = await Photo.findById(req.params.id)
        .populate('uploadedBy', 'name email')
        .populate('album', 'name');

        if(!photo) {
            return res.status(404).json({ message: 'Photo not found' });
        }

        if(photo.family.toString() !== req.user.family._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this photo' });
        }

        res.json(photo);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// desc Delete photo
// route DELETE /api/photos/:id
// access Private

const deletePhoto = async(req, res) => {
    try {
        const photo = await Photo.findById(req.params.id);

        if(!photo) {
            return res.status(404).json({ message: 'Photo not found' });
        }

        if(photo.family.toString() !== req.user.family._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this photo' });
        }

        // Extract public_id from Cloudinary URLs
        const extractPublicId = (url) => {
            const urlParts = url.split('/');
            const publicIdWithExtension = urlParts.slice(-2).join('/');
            return publicIdWithExtension.split('.')[0];
        };

        const imagePublicId = extractPublicId(photo.imageURL);
        const thumbnailPublicId = extractPublicId(photo.thumbnailURL);

        // Delete from Cloudinary
        try {
            await cloudinary.uploader.destroy(imagePublicId, { resource_type: 'image' });
            await cloudinary.uploader.destroy(thumbnailPublicId, { resource_type: 'image' });
        } catch (cloudinaryError) {
            console.error('Cloudinary deletion error:', cloudinaryError);
        }

        if (photo.album) {
            await Album.findByIdAndUpdate(photo.album, {
                $pull: { photos: photo._id }
            });
        }

        // Delete from database
        await photo.deleteOne();

        res.json({ message: 'Photo deleted successfully' });
    } catch(error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    uploadPhoto,
    getPhoto,
    getPhotos,
    deletePhoto
};