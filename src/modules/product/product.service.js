const Product = require("./product.model");
const Brand = require("../brand/brand.model");
const Category = require("../category/category.model");
const cloudinary = require("../../config/cloudinary");

// 🔹 Create Product
// exports.createProduct = async (data, files, userId) => {
//   // 🔥 validate brand
//   const brandExists = await Brand.findById(data.brand);
//   if (!brandExists) {
//     throw new Error("Invalid Brand ID");
//   }

//   // 🔥 validate category
//   if (data.category) {
//     const catExists = await Category.findById(data.category);
//     if (!catExists) {
//       throw new Error("Invalid Category ID");
//     }
//   }

//   // 🔥 handle images
//   let images = [];

//   if (files && files.length > 0) {
//     images = files.map(file => ({
//       url: file.path,          // ✅ Cloudinary URL
//       public_id: file.filename // ✅ needed for delete
//     }));
//   }

//   const product = await Product.create({
//     ...data,
//     images,
//     createdBy: userId
//   });

//   return product;
// };

// 🔹 Create Product
exports.createProduct = async (data, files, userId, userRole) => {
  // 🔥 validate brand
  let brandData;

  if (userRole === "ADMIN") {
    if (!Array.isArray(data.brand) || data.brand.length === 0) {
      throw new Error("Admin must provide brand array");
    }

    const brands = await Brand.find({
      _id: { $in: data.brand }
    });

    if (brands.length !== data.brand.length) {
      throw new Error("One or more Brand IDs are invalid");
    }

    brandData = data.brand;
  } else {
    const brandExists = await Brand.findById(data.brand);

    if (!brandExists) {
      throw new Error("Invalid Brand ID");
    }

    brandData = [data.brand];
  }

  // 🔥 validate category
  if (data.category) {
    const catExists = await Category.findById(data.category);
    if (!catExists) {
      throw new Error("Invalid Category ID");
    }
  }

  // 🔥 handle images
  let images = [];

  if (files && files.length > 0) {
    images = files.map(file => ({
      url: file.path,
      public_id: file.filename
    }));
  }

  const product = await Product.create({
    ...data,
    brand: brandData,
    images,
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

  return {
    products,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit)
  };
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

  // 🔥 replace images
  if (files && files.length > 0) {
    // ❌ delete old images from Cloudinary
    if (product.images && product.images.length > 0) {
      for (let img of product.images) {
        if (img.public_id) {
          await cloudinary.uploader.destroy(img.public_id);
        }
      }
    }

    // ✅ save new images
    product.images = files.map(file => ({
      url: file.path,
      public_id: file.filename
    }));
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

  // ❌ delete all images from Cloudinary
  if (product.images && product.images.length > 0) {
    for (let img of product.images) {
      if (img.public_id) {
        await cloudinary.uploader.destroy(img.public_id);
      }
    }
  }

  await product.deleteOne();

  return true;
};


// 🔹 Get Products By Category (ADMIN only)
exports.getProductsByCategory = async (categoryId, query) => {
  const { page = 1, limit = 10 } = query;

  // validate category
  const categoryExists = await Category.findById(categoryId);

  if (!categoryExists) {
    throw new Error("Invalid Category ID");
  }

  const products = await Product.aggregate([
    {
      $match: {
        category: categoryExists._id
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

    { $unwind: "$creator" },

    {
      $match: {
        "creator.role": "ADMIN"
      }
    },

    { $sort: { createdAt: -1 } },

    { $skip: (page - 1) * parseInt(limit) },

    { $limit: parseInt(limit) },

    {
      $lookup: {
        from: "brands",
        localField: "brand",
        foreignField: "_id",
        as: "brand"
      }
    },

    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category"
      }
    },

    {
      $unwind: {
        path: "$category",
        preserveNullAndEmptyArrays: true
      }
    }
  ]);

  const total = await Product.aggregate([
    {
      $match: {
        category: categoryExists._id
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
    { $unwind: "$creator" },
    {
      $match: {
        "creator.role": "ADMIN"
      }
    },
    {
      $count: "total"
    }
  ]);

  return {
    products,
    total: total[0]?.total || 0,
    page: Number(page),
    totalPages: Math.ceil((total[0]?.total || 0) / limit)
  };
};

