// product.routes.js
const express = require("express");
const router = express.Router();

const productController = require("./product.controller");
const { verifyToken, isAdmin } = require("../../middleware/isAdmin");
const upload = require("../../middleware/upload");
const { checkSubscription } = require("../../middleware/checkSubscription");


// multiple images upload
router.post(
  "/create",
  verifyToken,
  // checkSubscription, // only SUBSCRIBED users can add product
  isAdmin, // only ADMIN can add product
  upload.array("images", 5),
  productController.createProduct
);

// 🔹 Get All
router.get("/", verifyToken, productController.getAllProducts);


// 🔹 Get Single
router.get("/:id", verifyToken, productController.getSingleProduct);


// 🔹 Update Product
router.put(
  "/:id",
  verifyToken,
  isAdmin,
  upload.array("images", 5),
  productController.updateProduct
);


// 🔹 Delete Product
router.delete(
  "/:id",
  verifyToken,
  isAdmin,
  productController.deleteProduct
);

module.exports = router;