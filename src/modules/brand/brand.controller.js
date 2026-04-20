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

// 🔹 Get All
exports.getAllBrands = async (req, res) => {
  try {
    const result = await brandService.getAllBrands(req.query);

    res.json({
      message: "Brands fetched successfully",
      ...result
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
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