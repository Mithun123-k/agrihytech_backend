// product.routes.js
const express = require("express");
const router = express.Router();

const productController = require("./product.controller");
const { verifyToken, isAdmin, isB2B } = require("../../middleware/isAdmin");
const upload = require("../../middleware/upload");
const { checkSubscription } = require("../../middleware/checkSubscription");


// multiple images upload
router.post(
  "/create",
  verifyToken,
  // checkSubscription, // only SUBSCRIBED users can add product
  isB2B, // only B2B users can add product
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
  isB2B,
  upload.array("images", 5),
  productController.updateProduct
);


// 🔹 Delete Product
router.delete(
  "/:id",
  verifyToken,
  isB2B,
  productController.deleteProduct
);



module.exports = router;