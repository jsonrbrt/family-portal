const Document = require("../models/Document");
const { cloudinary } = require("../config/cloudinary");
const { generateDocumentReport } = require('../utils/generatePDF');

// desc Upload a document
// route POST api/documents/upload
// access Private

const uploadDocument = async(req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        // Validate file size (10MB max)
        if (req.file.size > 10 * 1024 * 1024) {
            return res.status(400).json({ message: 'File size must be less than 10MB' });
        }

        // Validate user is part of a family
        if (!req.user.family) {
            return res.status(400).json({ message: 'You must be part of a family to upload a document'});
        }

        const { name, category, description, tags } = req.body;

        // Validate name
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ message: 'Document name is required' });
        }

        if (name.length > 200) {
            return res.status(400).json({ message: 'Document name must be less than 200 characters' });
        }

        // Validate category
        const validCategories = ['birth_certificate', 'passport', 'deed', 'health_record', 'other'];
        if (category && !validCategories.includes(category)) {
            return res.status(400).json({ message: 'Invalid category' });
        }

        // Validate description length
        if (description && description.length > 1000) {
            return res.status(400).json({ message: 'Description must be les than 1000 characters' });
        }
        // Upload to Cloudinary using buffer from memory
        let resourceType = "image";
        let uploadOptions = {
          folder: "family-portal/documents",
        };

        if (req.file.mimetype === "application/pdf") {
          uploadOptions.resource_type = "image";
          uploadOptions.format = "pdf";
        } else if (req.file.mimetype.startsWith("image/")) {
          uploadOptions.resource_type = "image";
        } else {
          uploadOptions.resource_type = "raw";
        }

        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            },
          );
          uploadStream.end(req.file.buffer);
        });

        // Create document in database
        const document = await Document.create({
            name: name || req.file.originalname,
            category: category || 'other',
            fileURL: result.secure_url,
            fileType: req.file.mimetype,
            fileSize: req.file.size,
            uploadedBy: req.user._id,
            family: req.user.family,
            description,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : []
        });

        res.status(201).json({
            message: 'Document uploaded successfully',
            document
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// desc Get all documents for user's family
// route GET api/documents
// access Private

const getDocuments = async(req, res) => {
    try {
        if (!req.user.family) {
            return res.status(400).json({ message: 'You must be a part of a family' });
        }
        const { category, search } = req.query;

        // Build query
        let query = { family: req.user.family };

        if (category && category !== 'all') {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        const documents = await Document.find(query)
        .populate('uploadedBy', 'name email')
        .sort({ createdAt: -1 });

        res.json(documents);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// desc Get single document
// route GET /api/documents/:id
// access Private

const getDocument = async(req, res) => {
    try {
        const document = await Document.findById(req.params.id)
        .populate('uploadedBy', 'name email');

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Check if user is in the same family
        if (document.family.toString() !== req.user.family._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this document' });
        }
        res.json(document)
    } catch(error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// desc Delete document
// route DELETE /api/documents/:id
// access Private

const deleteDocument = async(req, res) => {
    try {
      const document = await Document.findById(req.params.id);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Check if user is in the same family
      if (document.family.toString() !== req.user.family._id.toString()) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this document" });
      }

      // Extract public_id from Cloudinary URL to delete from Cloudinary
      const urlParts = document.fileURL.split("/");
      const publicIdWithExtension = urlParts.slice(-2).join("/");
      const publicId = publicIdWithExtension.split(".")[0];

      // Determine resource type based on file type
      let resourceType = 'raw';
      if (document.fileType.startsWith('image/')) {
        reourceType = 'image';
      } else if (document.fileType.startsWith('video/')) {
        resourceType = 'video';
      }

      // Delete from Cloudinary
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (cloudinaryError) {
        console.error('Cloudinary deletion error:', cloudinaryError);
    }

      // Delete from database
      await document.deleteOne();

      res.json({ message: "Document deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// desc Generate PDF report for all documents
// route GET /api/documents/generate-report
// access Private
const generateReport = async(req, res) => {
    try {
        if (!req.user.family) {
            return res.status(400).json({ message: 'You must be part of a family' });
        }

        // Fetch all documents for the family
        const documents = await Document.find({ family: req.user.family._id.toString() })
        .populate('uploadedBy', 'name email')
        .sort({ createdAt: -1 });

        // Generate PDF
        const pdfBuffer = await generateDocumentReport(
            req.user.family,
            documents,
            req.user
        );

        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=Family_Documents_Report_${Date.now()}.pdf`
        );
        res.setHeader('Content-Length', pdfBuffer.length);

        // Send PDF
        res.send(pdfBuffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to generate report', error: error.message });
    }
};

module.exports = {
    uploadDocument,
    getDocuments,
    getDocument,
    deleteDocument,
    generateReport
};