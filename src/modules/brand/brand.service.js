const Brand = require("./brand.model");
const Category = require("../category/category.model");
const mongoose = require("mongoose");
const cloudinary = require("../../config/cloudinary");
const Product = require("../product/product.model");
const User = require("../auth/auth.model");


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

// User-specific brands by category

exports.getUserBrandsByCategory = async (categoryId, query) => {
  const { page = 1, limit = 10, search = "" } = query;

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new Error("Invalid Category ID");
  }

  const brands = await Brand.aggregate([
    {
      $match: {
        category: new mongoose.Types.ObjectId(categoryId),
        name: { $regex: search, $options: "i" }
      }
    },

    // Brand creator lookup
    {
      $lookup: {
        from: "users",
        localField: "createdBy",
        foreignField: "_id",
        as: "creator"
      }
    },

    {
      $unwind: "$creator"
    },

    // Only admin-created brands
    {
      $match: {
        "creator.role": "ADMIN"
      }
    },

    // Category populate
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category"
      }
    },

    {
      $unwind: "$category"
    },

    // Products lookup
    {
      $lookup: {
        from: "products",
        let: { brandId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$brand", "$$brandId"]
              }
            }
          },

          // Product creator lookup
          {
            $lookup: {
              from: "users",
              localField: "createdBy",
              foreignField: "_id",
              as: "productCreator"
            }
          },

          {
            $unwind: "$productCreator"
          },

          // Only admin-created products
          {
            $match: {
              "productCreator.role": "ADMIN"
            }
          },

          {
            $project: {
              _id: 1,
              name: 1,
              image: 1,
              price: 1,
              stock: 1,
              createdAt: 1
            }
          }
        ],
        as: "products"
      }
    },

    {
      $addFields: {
        totalProducts: { $size: "$products" }
      }
    },

    {
      $project: {
        _id: 1,
        name: 1,
        image: 1,
        public_id: 1,
        createdAt: 1,
        updatedAt: 1,
        totalProducts: 1,
        products: 1,
        category: {
          _id: "$category._id",
          name: "$category.name"
        }
      }
    },

    { $sort: { createdAt: -1 } },
    { $skip: (page - 1) * parseInt(limit) },
    { $limit: parseInt(limit) }
  ]);

  const totalData = await Brand.aggregate([
    {
      $match: {
        category: new mongoose.Types.ObjectId(categoryId),
        name: { $regex: search, $options: "i" }
      }
    },

    {
      $lookup: {
        from: "users",
        localField: "createdBy",
        foreignField: "_id",
        as: "creator"
      }
    },

    {
      $unwind: "$creator"
    },

    {
      $match: {
        "creator.role": "ADMIN"
      }
    },

    {
      $count: "total"
    }
  ]);

  const total = totalData[0]?.total || 0;

  return {
    brands,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit)
  };
};

// 🔹 Get All Brands with product usage count
exports.getAllBrands = async (query, user) => {
  const { search = "" } = query;

  const filter = {
    name: { $regex: search, $options: "i" },
  };

  let productMatch = {};

  // 🔥 B2B -> all B2B users products
  if (user.role === "B2B") {
    const b2bUsers = await User.find({ role: "B2B" }).select("_id");

    productMatch.createdBy = {
      $in: b2bUsers.map((u) => u._id),
    };
  }

  // 🔥 B2C -> all ADMIN products
  else if (user.role === "B2C") {
    const admins = await User.find({ role: "ADMIN" }).select("_id");

    productMatch.createdBy = {
      $in: admins.map((u) => u._id),
    };
  }

  const brands = await Brand.aggregate([
    {
      $match: filter,
    },

    {
      $lookup: {
        from: "products",
        let: { brandId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: ["$$brandId", "$brand"],
              },
            },
          },

          ...(Object.keys(productMatch).length
            ? [{ $match: productMatch }]
            : []),
        ],
        as: "products",
      },
    },

    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category",
      },
    },

    {
      $unwind: {
        path: "$category",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $addFields: {
        productCount: { $size: "$products" },
      },
    },

    {
      $project: {
        products: 0,
      },
    },

    // 🔥 Highest product count first
    {
      $sort: {
        productCount: -1,
        createdAt: -1,
      },
    },
  ]);

  const totalBrands = await Brand.countDocuments(filter);

  const totalProducts = await Product.countDocuments(
    Object.keys(productMatch).length ? productMatch : {}
  );

  return {
    brands,
    totalBrands,
    totalProducts,
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


// 🔥 Get Products by Brand

exports.getProductsByBrand = async (brandId, query, user) => {
  const { page = 1, limit = 10, search = "" } = query;

  // console.log("Received brandId:", brandId);

  const brand = await Brand.findById(brandId);

  if (!brand) {
    throw new Error(`Brand not found for ID: ${brandId}`);
  }

  let creatorIds = [];

  if (user.role === "B2C" || user.role === "USER") {
    const admins = await User.find({ role: "ADMIN" }).select("_id");
    creatorIds = admins.map((u) => u._id);
  } else if (user.role === "B2B") {
    const b2bUsers = await User.find({ role: "B2B" }).select("_id");
    creatorIds = b2bUsers.map((u) => u._id);
  }

  const filter = {
    brand: { $in: [brandId] },
    name: { $regex: search, $options: "i" }
  };

  if (user.role !== "ADMIN") {
    filter.createdBy = { $in: creatorIds };
  }

  const products = await Product.find(filter)
    .populate("createdBy", "name role")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Product.countDocuments(filter);

  return {
    brand,
    products,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit)
  };
};

// 🔥 Get My Brands
exports.getMyBrands = async (userId, query) => {
  const { page = 1, limit = 10, search = "" } = query;

  const filter = {
    createdBy: userId,
    name: { $regex: search, $options: "i" }
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

// 🔥 Get My Products By Brand
exports.getMyProductsByBrand = async (brandId, userId, query) => {
  const { page = 1, limit = 10, search = "" } = query;

  const brand = await Brand.findById(brandId);

  if (!brand) {
    throw new Error("Brand not found");
  }

  const filter = {
    brand: brandId,
    createdBy: userId,
    name: { $regex: search, $options: "i" }
  };

  const products = await Product.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Product.countDocuments(filter);

  return {
    brand,
    products,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit)
  };
};

// 🔥 Get Brands By Product ID
exports.getBrandsByProductId = async (productId) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid Product ID");
  }

  const product = await Product.findById(productId)
    .populate({
      path: "brand",
      populate: {
        path: "category",
        select: "name"
      }
    });

  if (!product) {
    throw new Error("Product not found");
  }

  return {
    productId: product._id,
    productName: product.name,
    totalBrands: product.brand.length,
    brands: product.brand
  };
};