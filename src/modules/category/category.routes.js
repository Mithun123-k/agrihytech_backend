const express = require("express");
const router = express.Router();

const categoryController = require("./category.controller");
const { verifyToken, isAdmin } = require("../../middleware/isAdmin");
const upload = require("../../middleware/upload"); // multer config

router.post(
  "/create",
  verifyToken,            // 🔐 must be logged in
  isAdmin,                // 🔥 ONLY ADMIN
  upload.single("image"), // 📸 image
  categoryController.createCategory
);

router.get("/", categoryController.getCategories);
router.get("/:id", categoryController.getCategoryById);

router.put(
  "/:id",
  verifyToken,            // 🔐 must be logged in
  isAdmin,                // 🔥 ONLY ADMIN
  upload.single("image"), // 📸 image
  categoryController.updateCategory
);

router.delete(
  "/:id",
  verifyToken,            // 🔐 must be logged in
  isAdmin,                // 🔥 ONLY ADMIN
  categoryController.deleteCategory
);

router.get("/:id/brands", categoryController.getBrandsByCategory);

module.exports = router;