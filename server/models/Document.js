const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter a document name"],
    },
    category: {
      type: String,
      enum: ["birth_certificate", "passport", "deed", "health_record", "other"],
      default: "other",
    },
    fileURL: {
      type: String,
      required: [true, "File URL is required"],
    },
    fileType: String,
    fileSize: Number,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    family: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Family",
      required: true,
    },
    tags: [String],
    description: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model('Document', documentSchema);