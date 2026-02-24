const express = require("express");
const router = express.Router();
const {
  createAlbum,
  getAlbum,
  getAlbums,
  deleteAlbum,
} = require("../controllers/albumController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createAlbum);
router.get("/", protect, getAlbums);
router.get("/:id", protect, getAlbum);
router.delete("/:id", protect, deleteAlbum);

module.exports = router;