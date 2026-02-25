const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

// Load env vars
dotenv.config();

const { cloudinary } = require("./config/cloudinary");

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Connect to database
connectDB();

const app = express();

app.set('trust proxy', 1);

// Rate limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts, please try again in 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many registration attempts, please try again in 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: "Upload limit reached. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiters
app.use("/api", generalLimiter);
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/register", registerLimiter);
app.use("/api/documents/upload", uploadLimiter);
app.use("/api/photos/upload", uploadLimiter);

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/families", require("./routes/familyRoutes"));
app.use("/api/documents", require("./routes/documentRoutes"));
app.use("/api/photos", require("./routes/photoRoutes"));
app.use("/api/albums", require("./routes/albumRoutes"));

// Test cloudinary connection
app.get("/api/test-cloudinary", async (req, res) => {
  try {
    const result = await cloudinary.api.ping();
    res.json({ message: "Cloudinary connected!", result });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Cloudinary connection failed", error: error.message });
  }
});

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "API is running!" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
