const mongoose = require("mongoose");

const photoSchema = new mongoose.Schema(
  {
    name: String,
    caption: String,
    imageURL: {
      type: String,
      required: [true, "Image URL is required"],
    },
    thumbnailURL: String,
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
    album: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Album",
    },
    tags: [String],
    dateTaken: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Photo", photoSchema);