const mongoose = require("mongoose");

const albumSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter an album name"],
    },
    description: String,
    coverPhoto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Photo",
    },
    family: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Family",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    photos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Photo",
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Album", albumSchema);