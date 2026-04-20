// banner.routes.js
const express = require("express");
const router = express.Router();

const bannerController = require("./banner.controller");
const { verifyToken, isAdmin } = require("../../middleware/isAdmin");
const upload = require("../../middleware/upload");


// 🔹 Create Banner (ADMIN only)
router.post(
  "/create",
  verifyToken,
  isAdmin,
  upload.single("image"),
  bannerController.createBanner
);


// 🔹 Get All Banners
router.get(
  "/",
  verifyToken,
  bannerController.getAllBanners
);


// 🔹 Update Banner (ADMIN only)
router.put(
  "/:id",
  verifyToken,
  isAdmin,
  upload.single("image"),
  bannerController.updateBanner
);


// 🔹 Delete Banner (ADMIN only)
router.delete(
  "/:id",
  verifyToken,
  isAdmin,
  bannerController.deleteBanner
);

module.exports = router;