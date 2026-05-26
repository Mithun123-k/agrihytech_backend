const categoryService = require("./category.service");

exports.createCategory = async (req, res) => {
  try {
    const category = await categoryService.createCategory(
      req.body,
      req.file,
      req.user._id
    );

    res.status(201).json({
      message: "Category created successfully",
      category
    });

  } catch (err) {
    res.status(400).json({
      error: err.message
    });
  }
};


exports.getAllPublicCategories = async (req, res) => {
  try {
    const categories = await categoryService.getAllPublicCategories(
      req.query
    );

    res.status(200).json({
      success: true,
      categories
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await categoryService.getAllCategories(
      req.query,
      req.user
    );
    res.json(categories);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    res.json(category);
  } catch (err) {
    res.status(404).json({
      error: err.message
    });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const category = await categoryService.updateCategory(
      req.params.id,
      req.body,
      req.file
    );
    res.json({
      message: "Category updated successfully",
      category
    });
  } catch (err) {
    res.status(400).json({
      error: err.message
    });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    await categoryService.deleteCategory(req.params.id);
    res.json({
      message: "Category deleted successfully"
    });
  } catch (err) {
    res.status(404).json({
      error: err.message
    });
  }
};

exports.getBrandsByCategory = async (req, res) => {
  try {
    const data = await categoryService.getBrandsByCategory(
      req.params.id,
      {
        ...req.query,
        adminId: req.user?._id
      }
    );

    res.json({
      message: "Brands fetched successfully",
      ...data
    });

  } catch (err) {
    res.status(404).json({
      error: err.message
    });
  }
};

exports.getMyCategories = async (req, res) => {
  try {
    const data = await categoryService.getMyCategories(
      req.query,
      req.user._id
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


exports.getMyBrandsByCategory = async (req, res) => {
  try {
    const data = await categoryService.getMyBrandsByCategory(
      req.params.id,
      req.query,
      req.user._id
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

// User
exports.getUserCategories = async (req, res) => {
  try {
    const result = await categoryService.getUserCategories(req.query);

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