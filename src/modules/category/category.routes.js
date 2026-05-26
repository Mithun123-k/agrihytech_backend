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



router.get("/", verifyToken, categoryController.getCategories);

router.get(
  "/public",
  categoryController.getAllPublicCategories
);

router.get(
  "/my-categories",
  verifyToken,
  categoryController.getMyCategories
);

// User-specific categories 
router.get("/user-categories", verifyToken, categoryController.getUserCategories);

router.get("/:id/brands", verifyToken, categoryController.getBrandsByCategory);
router.get(
  "/:id/my-brands",
  verifyToken,
  categoryController.getMyBrandsByCategory
);


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


module.exports = router;