// brand.controller.js
const brandService = require("./brand.service");

exports.createBrand = async (req, res) => {
  try {
    const brand = await brandService.createBrand(
      req.body,
      req.file,
      req.user._id
    );

    res.status(201).json({
      message: "Brand created successfully",
      brand
    });

  } catch (err) {
    res.status(400).json({
      message: "Something went wrong",
      error: err.message
    });
  }
};

// brand.controller.js
exports.getBrandsByCategory = async (req, res) => {
  try {
    const result = await brandService.getBrandsByCategory(
      req.params.id,
      req.query
    );

    res.json({
      message: "Brands fetched successfully",
      ...result
    });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// User-specific brands
exports.getUserBrandsByCategory = async (req, res) => {
  try {
    const result = await brandService.getUserBrandsByCategory(
      req.params.categoryId,
      req.query
    );

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// 🔹 Get All
exports.getAllBrands = async (req, res) => {
  try {
    const result = await brandService.getAllBrands(
      req.query,
      req.user   // 🔥 THIS IS CRITICAL
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};


// 🔹 Update
exports.updateBrand = async (req, res) => {
  try {
    const brand = await brandService.updateBrand(
      req.params.id,
      req.body,
      req.file
    );

    res.json({
      message: "Brand updated successfully",
      brand
    });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


// 🔹 Delete
exports.deleteBrand = async (req, res) => {
  try {
    await brandService.deleteBrand(req.params.id);

    res.json({
      message: "Brand deleted successfully"
    });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};



exports.getProductsByBrand = async (req, res) => {
  try {
    const data = await brandService.getProductsByBrand(
      req.params.id,
      req.query,
      req.user
    );

    res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// 🔥 Get Logged-in User Brands
exports.getMyBrands = async (req, res) => {
  try {
    const result = await brandService.getMyBrands(
      req.user._id,
      req.query
    );

    res.json({
      message: "My brands fetched successfully",
      ...result
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

exports.getMyProductsByBrand = async (req, res) => {
  try {
    const data = await brandService.getMyProductsByBrand(
      req.params.id,
      req.user._id,
      req.query
    );

    res.status(200).json({
      success: true,
      ...data
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.getBrandsByProductId = async (req, res) => {
  try {
    const data = await brandService.getBrandsByProductId(
      req.params.productId
    );

    res.status(200).json({
      success: true,
      ...data
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};