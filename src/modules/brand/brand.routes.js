// brand.routes.js
const express = require("express");
const router = express.Router();

const brandController = require("./brand.controller");
const { verifyToken, isAdmin } = require("../../middleware/isAdmin");
const upload = require("../../middleware/upload");

// 🔥 Only ADMIN can create brand
router.post(
  "/create",
  verifyToken,
  isAdmin,
  upload.single("image"),
  brandController.createBrand
);

// 🔹 Get All Brands
router.get("/", verifyToken, brandController.getAllBrands);
router.get("/:id", brandController.getBrandsByCategory);


// 🔹 Update Brand
router.put(
  "/:id",
  verifyToken,
  isAdmin,
  upload.single("image"),
  brandController.updateBrand
);


// 🔹 Delete Brand
router.delete(
  "/:id",
  verifyToken,
  isAdmin,
  brandController.deleteBrand
);

module.exports = router;