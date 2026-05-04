// brand.routes.js
const express = require("express");
const router = express.Router();

const brandController = require("./brand.controller");
const { verifyToken, isAdmin, isB2B } = require("../../middleware/isAdmin");
const upload = require("../../middleware/upload");

// 🔥 Only B2B users can create brand
router.post(
  "/create",
  verifyToken,
  isB2B,
  upload.single("image"),
  brandController.createBrand
);

// 🔹 Get All Brands
router.get("/", verifyToken, brandController.getAllBrands);
router.get("/my-brands", verifyToken, brandController.getMyBrands);
router.get("/:id", brandController.getBrandsByCategory);


// 🔹 Update Brand
router.put(
  "/:id",
  verifyToken,
  isB2B,
  upload.single("image"),
  brandController.updateBrand
);


// 🔹 Delete Brand
router.delete(
  "/:id",
  verifyToken,
  isB2B,
  brandController.deleteBrand
);

router.get("/:id/products", brandController.getProductsByBrand);



module.exports = router;