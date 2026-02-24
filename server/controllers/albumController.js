const Album = require("../models/Album");
const Photo = require("../models/Photo");

//desc Create album
//route POST /api/albums
//access Private

const createAlbum = async(req, res) => {
    try {
        if(!req.user.family) {
            return res.status(400).json({ message: 'You must be part of a family'});
        }

        const { name, description } = req.body;

        // Validate name
        if (!name) {
            return res.status(400).json({ message: 'You must be part of a family' });
        }

        if (name.trim().length === 0) {
            return res.status(400).json({ message: 'Album name cannot be empty'});
        }

        if (name.length > 100) {
            return res.status(400).json({ message: 'Album name must be less than 100 characters' });
        }

        // Validate description
        if (description && description.length > 500) {
            return res.status(400).json({ message: 'Description must be less than 500 chacaters' });
        }

        const album = await Album.create({
            name,
            description,
            family: req.user.family._id,
            createdBy: req.user._id
        });

        res.status(201).json({ message: 'Album created successfully',
            album
         });
    } catch(error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

//desc Get all albums for user's family
//route GET /api/albums
//access Private

const getAlbums = async(req, res) => {
    try {
        if(!req.user.family) {
            return res.status(400).json({ message: 'You must be part of a family' });
        }

        const albums = await Album.find({ family: req.user.family._id })
        .populate('createdBy', 'name email')
        .populate('photos')
        .sort({ createdAt: -1 });

        res.json(albums);
    } catch(error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

//desc Get single album
//route GET /api/albums/:id
//access Private

const getAlbum = async(req, res) => {
    try {
        const album = await Album.findById(req.params.id)
        .populate('createdBy', 'name email')
        .populate({
            path: 'photos',
            populate: { path: 'uploadedBy', select: 'name email' }
        });

        if(!album) {
            return res.status(404).json({ message: 'Album not found' });
        }

        if(album.family.toString() !== req.user.family._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this album' });
        }

        res.json(album)
    } catch(error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

//desc Delete album
//route DELETE /api/albums/:id
//access Private

const deleteAlbum = async(req, res) => {
    try {
        const album = await Album.findById(req.params.id);

        if(!album) {
            return res.status(404).json({ message: 'Album not found' });
        }

        // Debug
        console.log('Album family:', album.family);
        console.log('User', req.user);
        console.log('User family:', req.user.family);
        console.log('User family._id:', req.user.family?._id);

        if(album.family.toString() != req.user.family._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this album' });
        }

        // Remove album reference from all photos in the album
        await Photo.updateMany(
            { album: album._id },
            { $set: { album: null } }
        );

        // Delete album
        await album.deleteOne();

        res.json({ message: 'Album deleted successfully' });
    } catch(error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    createAlbum,
    getAlbum,
    getAlbums,
    deleteAlbum
};