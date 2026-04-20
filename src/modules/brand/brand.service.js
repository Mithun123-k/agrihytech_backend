// brand.service.js
const Brand = require("./brand.model");
const Category = require("../category/category.model");
const fs = require("fs");
const mongoose = require("mongoose");


exports.createBrand = async (data, file, userId) => {

  if (!file) {
    throw new Error("Brand image is required");
  }

  // 🔥 validate category
  const categoryId = data.category?.trim();

  const categoryExists = await Category.findById(categoryId);
  if (!categoryExists) {
    throw new Error("Invalid Category ID");
  }

  const brand = await Brand.create({
    name: data.name,
    image: file.path,
    category: categoryId,
    createdBy: userId
  });

  return brand;
};



exports.getBrandsByCategory = async (categoryId, query) => {

  const { page = 1, limit = 10, search = "" } = query;

  // 🔥 validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new Error("Invalid Category ID");
  }

  const filter = {
    category: categoryId,
    name: { $regex: search, $options: "i" }
  };

  const brands = await Brand.find(filter)
    .populate("category", "name")
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Brand.countDocuments(filter);

  return { brands, total };
};

// Get All Brands with Category Name
exports.getAllBrands = async (query) => {
  const { page = 1, limit = 10, search = "" } = query;

  const filter = {
    name: { $regex: search, $options: "i" }
  };

  const brands = await Brand.find(filter)
    .populate("category", "name") // 🔥 important
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Brand.countDocuments(filter);

  return { brands, total };
};

// Update Brand
exports.updateBrand = async (id, data, file) => {

  const brand = await Brand.findById(id);
  if (!brand) {
    throw new Error("Brand not found");
  }

  // 🔥 update category
  if (data.category) {
    const categoryExists = await Category.findById(data.category);
    if (!categoryExists) {
      throw new Error("Invalid Category ID");
    }

    brand.category = data.category;
  }

  // image update
  if (file) {
    if (brand.image && fs.existsSync(brand.image)) {
      fs.unlinkSync(brand.image);
    }
    brand.image = file.path;
  }

  if (data.name) {
    brand.name = data.name;
  }

  await brand.save();

  return brand;
};


// 🔹 Delete Brand
exports.deleteBrand = async (id) => {

  const brand = await Brand.findById(id);
  if (!brand) {
    throw new Error("Brand not found");
  }

  // 🔥 delete image from folder
  if (brand.image && fs.existsSync(brand.image)) {
    fs.unlinkSync(brand.image);
  }

  await Brand.findByIdAndDelete(id);

  return true;
};

