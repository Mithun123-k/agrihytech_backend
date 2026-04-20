const Brand = require("./brand.model");
const Category = require("../category/category.model");
const mongoose = require("mongoose");
const cloudinary = require("../../config/cloudinary");

// 🔹 Create Brand
exports.createBrand = async (data, file, userId) => {
  if (!file) {
    throw new Error("Brand image is required");
  }

  if (!data.name) {
    throw new Error("Brand name is required");
  }

  // 🔥 validate category
  const categoryId = data.category?.trim();

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new Error("Invalid Category ID");
  }

  const categoryExists = await Category.findById(categoryId);
  if (!categoryExists) {
    throw new Error("Category not found");
  }

  // 🔥 optional: prevent duplicate brand
  const exists = await Brand.findOne({ name: data.name });
  if (exists) {
    throw new Error("Brand already exists");
  }

  return await Brand.create({
    name: data.name,
    image: file.path,          // ✅ Cloudinary URL
    public_id: file.filename,  // ✅ required for delete
    category: categoryId,
    createdBy: userId,
  });
};


// 🔹 Get Brands By Category
exports.getBrandsByCategory = async (categoryId, query) => {
  const { page = 1, limit = 10, search = "" } = query;

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new Error("Invalid Category ID");
  }

  const filter = {
    category: categoryId,
    name: { $regex: search, $options: "i" },
  };

  const brands = await Brand.find(filter)
    .populate("category", "name")
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Brand.countDocuments(filter);

  return {
    brands,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
  };
};


// 🔹 Get All Brands
exports.getAllBrands = async (query) => {
  const { page = 1, limit = 10, search = "" } = query;

  const filter = {
    name: { $regex: search, $options: "i" },
  };

  const brands = await Brand.find(filter)
    .populate("category", "name")
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Brand.countDocuments(filter);

  return {
    brands,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
  };
};


// 🔹 Update Brand
exports.updateBrand = async (id, data, file) => {
  const brand = await Brand.findById(id);

  if (!brand) {
    throw new Error("Brand not found");
  }

  // 🔥 update name with duplicate check
  if (data.name) {
    const exists = await Brand.findOne({
      name: data.name,
      _id: { $ne: id },
    });

    if (exists) {
      throw new Error("Brand already exists");
    }

    brand.name = data.name;
  }

  // 🔥 update category
  if (data.category) {
    if (!mongoose.Types.ObjectId.isValid(data.category)) {
      throw new Error("Invalid Category ID");
    }

    const categoryExists = await Category.findById(data.category);
    if (!categoryExists) {
      throw new Error("Category not found");
    }

    brand.category = data.category;
  }

  // 🔥 replace image
  if (file) {
    // ❌ delete old image from Cloudinary
    if (brand.public_id) {
      await cloudinary.uploader.destroy(brand.public_id);
    }

    // ✅ save new image
    brand.image = file.path;
    brand.public_id = file.filename;
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

  // ❌ delete from Cloudinary
  if (brand.public_id) {
    await cloudinary.uploader.destroy(brand.public_id);
  }

  await brand.deleteOne();

  return true;
};