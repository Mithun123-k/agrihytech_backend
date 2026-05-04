
const jwt = require("jsonwebtoken");
const User = require("../modules/auth/auth.model");

exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;

    next();
  } catch (err) {
    res.status(401).json({ message: "Unauthorized" });
  }
};


// middlewares/isAdmin.js


exports.isAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Access denied. Only ADMIN can create category"
      });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.isB2B = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.role !== "B2B" && req.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Access denied. Only B2B or ADMIN users can perform this action"
      });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
