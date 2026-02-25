const User = require("../models/User");
const Family = require("../models/Family");
const generateToken = require("../utils/generateToken");

// desc: Register new user and create a family
// route: POST/api/auth/register
// access: Public

const registerUser = async (req, res) => {
  try {
    const { name, email, username, password, familyName } = req.body;

    // Validate individual fields
    const missingFields = [];
    if (!name || name.trim() === "") missingFields.push("Name");
    if (!email || email.trim() === "") missingFields.push("Email");
    if (!username || username.trim() === "") missingFields.push("Username");
    if (!password) missingFields.push("Password");
    if (!familyName || familyName.trim() === "")
      missingFields.push("Family Name");

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Please provide: ${missingFields.join(", ")}`,
      });
    }
    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create family first
    const family = await Family.create({
      name: familyName,
    });

    // Create user
    const user = await User.create({
      name,
      email,
      username,
      password,
      role: "admin",
      family: family._id,
    });

    // Add user to family members and admins
    family.members.push(user._id);
    family.admins.push(user._id);
    await family.save();

    // Return user info and token
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      family: family,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error(error);
    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: messages.join(". ") });
    }

    // Handle duplicate key errors (email/username already exists)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
      });
    }

    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// desc Register new user without creating family
// route POST /api/auth/register-no-family
// access Public

const registerUserNoFamily = async (req, res) => {
  try {
    const { name, email, username, password } = req.body;

    // Validation
    if (!name || !email || !username || !password) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create user without family
    const user = await User.create({
      name,
      email,
      username,
      password,
      role: "member",
    });

    // Return user info and token
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", message: error.message });
  }
};

// desc: Login user
// route: POST/api/auth/login
// access: Public

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    // Check for user (include password for comparison)
    const user = await User.findOne({ email })
      .select("+password")
      .populate("family");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Return user info and token
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      family: user.family,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// desc: Get current user
// route: GET/api/auth/me
// access: Private

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("family");
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  registerUser,
  registerUserNoFamily,
  loginUser,
  getMe,
};
