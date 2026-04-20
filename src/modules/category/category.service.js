const Category = require("./category.model");
const Product = require("../product/product.model");
const fs = require("fs");


exports.createCategory = async (data, file, userId) => {
  const { name } = data;

  if (!name) {
    throw new Error("Category name is required");
  }

  if (!file) {
    throw new Error("Image is required");
  }

  const existing = await Category.findOne({ name });
  if (existing) {
    throw new Error("Category already exists");
  }

  const category = await Category.create({
    name,
    image: file.path, // multer path
    createdBy: userId
  });

  return category;
};

exports.getCategoryById = async (id) => {
  const category = await Category.findById(id);
  if (!category) {
    throw new Error("Category not found");
  }
  return category;
};

// 🔹 Get All Categories
exports.getAllCategories = async (query) => {
  const { page = 1, limit = 10, search = "" } = query;

  const filter = {
    name: { $regex: search, $options: "i" }
  };

  const categories = await Category.find(filter)
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Category.countDocuments(filter);

  return {
    categories,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit)
  };
};


// 🔹 Update Category
exports.updateCategory = async (id, data, file) => {
  const category = await Category.findById(id);

  if (!category) {
    throw new Error("Category not found");
  }

  if (data.name) {
    category.name = data.name;
  }

  // 🔥 replace image if uploaded
  if (file) {
    if (category.image && fs.existsSync(category.image)) {
      fs.unlinkSync(category.image);
    }

    category.image = file.path;
  }

  await category.save();

  return category;
};


// 🔹 Delete Category
exports.deleteCategory = async (id) => {
  const category = await Category.findById(id);

  if (!category) {
    throw new Error("Category not found");
  }

  // 🔥 Prevent delete if used in products
  const productExists = await Product.findOne({
    category: id
  });

  if (productExists) {
    throw new Error("Category is used in products");
  }

  // delete image
  if (category.image && fs.existsSync(category.image)) {
    fs.unlinkSync(category.image);
  }

  await Category.findByIdAndDelete(id);

  return true;
};