const Category = require("./category.model");
const Product = require("../product/product.model");
const cloudinary = require("../../config/cloudinary");
const mongoose = require("mongoose");
const Brand = require("../brand/brand.model");

// 🔹 Create
exports.createCategory = async (data, file, userId) => {
  const { name } = data;

  if (!name) throw new Error("Category name is required");
  if (!file) throw new Error("Image is required");

  const exists = await Category.findOne({ name });
  if (exists) throw new Error("Category already exists");

  return await Category.create({
    name,
    image: file.path,
    public_id: file.filename,
    createdBy: userId,
  });
};


// 🔹 Get By ID
exports.getCategoryById = async (id) => {
  const result = await Category.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(id) }
    },

    {
      $lookup: {
        from: "brands",
        localField: "_id",
        foreignField: "category",
        as: "brands"
      }
    },

    {
      $addFields: {
        brandIds: {
          $map: {
            input: "$brands",
            as: "b",
            in: "$$b._id"
          }
        },
        totalBrands: { $size: "$brands" }
      }
    },

    {
      $project: {
        brands: 0
      }
    }
  ]);

  if (!result.length) throw new Error("Category not found");

  return result[0];
};


// 🔹 Get All (Pagination + Search)
exports.getAllCategories = async (query) => {
  const { page = 1, limit = 10, search = "" } = query;

  const matchStage = {
    name: { $regex: search, $options: "i" },
  };

  const categories = await Category.aggregate([
    { $match: matchStage },

    {
      $lookup: {
        from: "brands", // 🔥 collection name
        localField: "_id",
        foreignField: "category",
        as: "brands"
      }
    },

    {
      $addFields: {
        brandIds: {
          $map: {
            input: "$brands",
            as: "b",
            in: "$$b._id"
          }
        },
        totalBrands: { $size: "$brands" }
      }
    },

    {
      $project: {
        brands: 0 // full data hide (optional)
      }
    },

    { $sort: { createdAt: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: parseInt(limit) }
  ]);

  const total = await Category.countDocuments(matchStage);

  return {
    categories,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
  };
};

// 🔹 Update
exports.updateCategory = async (id, data, file) => {
  const category = await Category.findById(id);
  if (!category) throw new Error("Category not found");

  // 🔥 name update with duplicate check
  if (data.name) {
    const exists = await Category.findOne({
      name: data.name,
      _id: { $ne: id },
    });

    if (exists) throw new Error("Category already exists");

    category.name = data.name;
  }

  // 🔥 replace image
  if (file) {
    if (category.public_id) {
      await cloudinary.uploader.destroy(category.public_id);
    }

    category.image = file.path;
    category.public_id = file.filename;
  }

  await category.save();
  return category;
};


// 🔹 Delete
exports.deleteCategory = async (id) => {
  const category = await Category.findById(id);
  if (!category) throw new Error("Category not found");

  // 🔥 prevent delete if used in products
  const productExists = await Product.findOne({ category: id });
  if (productExists) {
    throw new Error("Category is used in products");
  }

  // ❌ delete from cloudinary
  if (category.public_id) {
    await cloudinary.uploader.destroy(category.public_id);
  }

  await category.deleteOne();
  return true;
};

// 🔥 Get Brands by Category
exports.getBrandsByCategory = async (categoryId, query) => {
  const { page = 1, limit = 10 } = query;

  const brands = await Brand.aggregate([
    {
      $match: {
        category: new mongoose.Types.ObjectId(categoryId)
      }
    },

    // 🔥 JOIN with products
    {
      $lookup: {
        from: "products",        // 🔥 collection name
        localField: "_id",
        foreignField: "brand",
        as: "products"
      }
    },

    // 🔥 COUNT products
    {
      $addFields: {
        productCount: { $size: "$products" }
      }
    },

    // 🔥 REMOVE products array (optional)
    {
      $project: {
        products: 0
      }
    },

    { $sort: { createdAt: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: parseInt(limit) }
  ]);

  const total = await Brand.countDocuments({
    category: categoryId
  });

  return {
    brands,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
  };
};