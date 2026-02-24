const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token (excluding password)
      req.user = await User.findById(decoded.id)
        .select("-password")
        .populate("family");

      if (!req.user) {
        return res
          .status(401)
          .json({ message: "Not authorized, user not found" });
      }
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }
  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

// Check if user is admin of their family
const adminOnly = async (req, res, next) => {
  if (req.user && req.user.family) {
    const family = req.user.family;
    const isAdmin = family.admins.some(
      (adminId) => adminId.toString() === req.user._id.toString(),
    );

    if (isAdmin) {
      next();
    } else {
      res.status(403).json({ message: "Not authorized as family admin" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no family" });
  }
};

module.exports = { protect, adminOnly };