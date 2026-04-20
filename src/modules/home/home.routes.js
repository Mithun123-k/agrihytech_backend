// home.routes.js
const express = require("express");
const router = express.Router();

const homeController = require("./home.controller");
const { verifyToken } = require("../../middleware/isAdmin");

// 🔹 Home API
router.get("/", verifyToken, homeController.getHome);

module.exports = router;