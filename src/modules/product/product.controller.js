// product.controller.js
const productService = require("./product.service");


exports.createProduct = async (req, res) => {
  try {
    const product = await productService.createProduct(
      req.body,
      req.files,
      req.user._id
    );

    res.status(201).json({
      message: "Product created successfully",
      product
    });

  } catch (err) {
    res.status(400).json({
      message: "Something went wrong",
      error: err.message
    });
  }
};

// 🔹 Get All
exports.getAllProducts = async (req, res) => {
  try {
    const result = await productService.getAllProducts(req.query);

    res.json({
      message: "Products fetched successfully",
      ...result
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// 🔹 Get Single
exports.getSingleProduct = async (req, res) => {
  try {
    const product = await productService.getSingleProduct(req.params.id);

    res.json({
      message: "Product fetched successfully",
      product
    });

  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};


// 🔹 Update
exports.updateProduct = async (req, res) => {
  try {
    const product = await productService.updateProduct(
      req.params.id,
      req.body,
      req.files
    );

    res.json({
      message: "Product updated successfully",
      product
    });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


// 🔹 Delete
exports.deleteProduct = async (req, res) => {
  try {
    await productService.deleteProduct(req.params.id);

    res.json({
      message: "Product deleted successfully"
    });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

