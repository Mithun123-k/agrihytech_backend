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

exports.getCategories = async (req, res) => {
  try {
    const categories = await categoryService.getAllCategories(req.query);
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