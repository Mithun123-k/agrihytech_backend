// product.service.js
const Product = require("./product.model");
const Brand = require("../brand/brand.model");
const Category = require("../category/category.model");
const fs = require("fs");

exports.createProduct = async (data, files, userId) => {

  // 🔥 check brand exists
  const brandExists = await Brand.findById(data.brand);
  if (!brandExists) {
    throw new Error("Invalid Brand ID");
  }

  let imagePaths = [];

  if (files && files.length > 0) {
    imagePaths = files.map(file => file.path);
  }

  const product = await Product.create({
    ...data,
    images: imagePaths,
    createdBy: userId
  });

  return product;
};

// 🔹 Get All Products
exports.getAllProducts = async (query) => {
  const { page = 1, limit = 10, search = "" } = query;

  const filter = {
    name: { $regex: search, $options: "i" }
  };

  const products = await Product.find(filter)
    .populate("brand", "name image")
    .populate("category", "name")
    .populate("subCategory", "name")
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Product.countDocuments(filter);

  return { products, total };
};



// 🔹 Get Single Product
exports.getSingleProduct = async (id) => {
  const product = await Product.findById(id)
    .populate("brand", "name image")
    .populate("category", "name")
    .populate("subCategory", "name");

  if (!product) {
    throw new Error("Product not found");
  }

  return product;
};



// 🔹 Update Product
exports.updateProduct = async (id, data, files) => {

  const product = await Product.findById(id);
  if (!product) {
    throw new Error("Product not found");
  }

  // 🔥 validate brand
  if (data.brand) {
    const brandExists = await Brand.findById(data.brand);
    if (!brandExists) throw new Error("Invalid Brand ID");
  }

  // 🔥 validate category
  if (data.category) {
    const catExists = await Category.findById(data.category);
    if (!catExists) throw new Error("Invalid Category ID");
  }

  // 🔥 handle new images
  if (files && files.length > 0) {
    // delete old images
    if (product.images && product.images.length > 0) {
      product.images.forEach(img => {
        if (fs.existsSync(img)) fs.unlinkSync(img);
      });
    }

    product.images = files.map(file => file.path);
  }

  // 🔥 update fields
  Object.keys(data).forEach(key => {
    product[key] = data[key];
  });

  await product.save();

  return product;
};



// 🔹 Delete Product
exports.deleteProduct = async (id) => {

  const product = await Product.findById(id);
  if (!product) {
    throw new Error("Product not found");
  }

  // 🔥 delete images
  if (product.images && product.images.length > 0) {
    product.images.forEach(img => {
      if (fs.existsSync(img)) fs.unlinkSync(img);
    });
  }

  await Product.findByIdAndDelete(id);

  return true;
};