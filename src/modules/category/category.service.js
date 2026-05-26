const Category = require("./category.model");
const Product = require("../product/product.model");
const cloudinary = require("../../config/cloudinary");
const mongoose = require("mongoose");
const Brand = require("../brand/brand.model");
const User = require("../auth/auth.model");

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

// get All public categories
exports.getAllPublicCategories = async (query) => {
  const { search = "" } = query;

  const categories = await Category.aggregate([
    {
      $match: {
        name: { $regex: search, $options: "i" }
      }
    },

    {
      $project: {
        _id: 1,
        name: 1,
        image: 1
      }
    },

    {
      $sort: { name: 1 }
    }
  ]);

  return categories.map((cat) => ({
    id: cat._id,
    name: cat.name,
    image: cat.image || null
  }));
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
exports.getAllCategories = async (query, user) => {
  const { page = 1, limit = 10, search = "" } = query;

  const matchStage = {
    name: { $regex: search, $options: "i" },
  };

  let productMatch = {};

  // 🔥 For B2C -> only ADMIN products
  if (user.role === "B2C") {
    const admins = await User.find({ role: "ADMIN" }).select("_id");

    productMatch.createdBy = {
      $in: admins.map((u) => u._id),
    };
  }

  const categories = await Category.aggregate([
    { $match: matchStage },

    // 🔥 Brands lookup
    {
      $lookup: {
        from: "brands",
        localField: "_id",
        foreignField: "category",
        as: "brands",
      },
    },

    // 🔥 Products lookup (for B2C admin product count)
    {
      $lookup: {
        from: "products",
        let: { categoryId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$category", "$$categoryId"],
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
      $addFields: {
        brandIds: {
          $map: {
            input: "$brands",
            as: "b",
            in: "$$b._id",
          },
        },

        totalBrands: { $size: "$brands" },

        // 🔥 New field
        productCount: { $size: "$products" },
      },
    },

    {
      $project: {
        brands: 0,
        products: 0,
      },
    },

    { $sort: { createdAt: -1 } },
    { $skip: (page - 1) * parseInt(limit) },
    { $limit: parseInt(limit) },
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
  const {
    page = 1,
    limit = 10,
    isAdmin = "false",
    adminId
  } = query;

  const matchCondition = {
    category: new mongoose.Types.ObjectId(categoryId)
  };

  // Only show admin-created brands
  if (isAdmin === "true" && adminId) {
    matchCondition.createdBy = new mongoose.Types.ObjectId(adminId);
  }

  const brands = await Brand.aggregate([
    {
      $match: matchCondition
    },

    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "brand",
        as: "products"
      }
    },

    {
      $unwind: {
        path: "$products",
        preserveNullAndEmptyArrays: true
      }
    },

    {
      $lookup: {
        from: "users",
        localField: "products.createdBy",
        foreignField: "_id",
        as: "creator"
      }
    },

    {
      $unwind: {
        path: "$creator",
        preserveNullAndEmptyArrays: true
      }
    },

    {
      $group: {
        _id: "$_id",
        name: { $first: "$name" },
        image: { $first: "$image" },
        category: { $first: "$category" },
        createdAt: { $first: "$createdAt" },

        productCount: {
          $sum: {
            $cond: [
              { $eq: ["$creator.role", "B2B"] },
              1,
              0
            ]
          }
        }
      }
    },

    { $sort: { createdAt: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: parseInt(limit) }
  ]);

  const total = await Brand.countDocuments(matchCondition);

  return {
    brands,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
  };
};


// 🔥 Get My Categories (only logged-in user's brand count)
exports.getMyCategories = async (query, userId) => {
  const { page = 1, limit = 10, search = "" } = query;

  const userObjectId = new mongoose.Types.ObjectId(userId);

  const matchStage = {
    name: { $regex: search, $options: "i" }
  };

  const categories = await Category.aggregate([
    {
      $match: matchStage
    },

    {
      $lookup: {
        from: "brands",
        let: { categoryId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$category", "$$categoryId"]
              }
            }
          },

          {
            $lookup: {
              from: "products",
              let: { brandId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        // ✅ brand is now array
                        { $in: ["$$brandId", "$brand"] },

                        // ✅ user created product
                        {
                          $eq: ["$createdBy", userObjectId]
                        }
                      ]
                    }
                  }
                }
              ],
              as: "myProducts"
            }
          },

          {
            $match: {
              "myProducts.0": { $exists: true }
            }
          }
        ],
        as: "myBrands"
      }
    },

    {
      $addFields: {
        brandIds: {
          $map: {
            input: "$myBrands",
            as: "b",
            in: "$$b._id"
          }
        },
        totalBrands: {
          $size: "$myBrands"
        }
      }
    },

    {
      $project: {
        myBrands: 0
      }
    },

    {
      $sort: { createdAt: -1 }
    },

    {
      $skip: (Number(page) - 1) * Number(limit)
    },

    {
      $limit: Number(limit)
    }
  ]);

  const total = await Category.countDocuments(matchStage);

  return {
    categories,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit))
  };
};

// 🔥 Get My Brands By Category
exports.getMyBrandsByCategory = async (categoryId, query, userId) => {
  const { page = 1, limit = 10 } = query;

  const userObjectId = new mongoose.Types.ObjectId(userId);

  const brands = await Brand.aggregate([
    {
      $match: {
        category: new mongoose.Types.ObjectId(categoryId)
      }
    },

    {
      $lookup: {
        from: "products",
        let: { brandId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  // ✅ brand is array now
                  { $in: ["$$brandId", "$brand"] },

                  // ✅ only user's products
                  { $eq: ["$createdBy", userObjectId] }
                ]
              }
            }
          }
        ],
        as: "myProducts"
      }
    },

    // only brands where user has products
    {
      $match: {
        "myProducts.0": { $exists: true }
      }
    },

    {
      $addFields: {
        productCount: { $size: "$myProducts" }
      }
    },

    {
      $project: {
        myProducts: 0
      }
    },

    {
      $sort: { createdAt: -1 }
    },

    {
      $skip: (Number(page) - 1) * Number(limit)
    },

    {
      $limit: Number(limit)
    }
  ]);

  // Better total count
  const total = await Brand.aggregate([
    {
      $match: {
        category: new mongoose.Types.ObjectId(categoryId)
      }
    },
    {
      $lookup: {
        from: "products",
        let: { brandId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $in: ["$$brandId", "$brand"] },
                  { $eq: ["$createdBy", userObjectId] }
                ]
              }
            }
          }
        ],
        as: "myProducts"
      }
    },
    {
      $match: {
        "myProducts.0": { $exists: true }
      }
    },
    {
      $count: "total"
    }
  ]);

  const totalCount = total[0]?.total || 0;

  return {
    brands,
    total: totalCount,
    page: Number(page),
    totalPages: Math.ceil(totalCount / Number(limit))
  };
};


// User 
exports.getUserCategories = async (query) => {
  const { page = 1, limit = 10, search = "" } = query;

  const matchStage = {
    name: { $regex: search, $options: "i" }
  };

  const categories = await Category.aggregate([
    { $match: matchStage },

    {
      $lookup: {
        from: "brands",
        let: { categoryId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$category", "$$categoryId"]
              }
            }
          },

          // 🔥 Join with users
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

          // 🔥 only admin created brands
          {
            $match: {
              "creator.role": "ADMIN"
            }
          }
        ],
        as: "adminBrands"
      }
    },

    {
      $addFields: {
        brandIds: {
          $map: {
            input: "$adminBrands",
            as: "b",
            in: "$$b._id"
          }
        },
        totalBrands: { $size: "$adminBrands" }
      }
    },

    {
      $project: {
        adminBrands: 0
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
    totalPages: Math.ceil(total / limit)
  };
};