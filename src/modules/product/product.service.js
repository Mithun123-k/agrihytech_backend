const Product = require("./product.model");
const Brand = require("../brand/brand.model");
const Category = require("../category/category.model");
const cloudinary = require("../../config/cloudinary");
const User = require("../auth/auth.model");
const mongoose = require("mongoose");

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
  // 🔥 Product limit check for B2B
  if (userRole === "B2B") {
    const productCount = await Product.countDocuments({ createdBy: userId });

    if (productCount >= 6) {
      throw new Error(
        "Product limit reached. You can only add 6 products. Delete an existing product to add a new one."
      );
    }
  }

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


// ==================================================
// 🔹 Calculate Distance Function
// ==================================================

const calculateDistance = (
  lat1,
  lon1,
  lat2,
  lon2
) => {

  const toRad = (value) =>
    (value * Math.PI) / 180;

  const R = 6371; // Earth Radius In KM

  const dLat =
    toRad(lat2 - lat1);

  const dLon =
    toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
};

// ==================================================
// 🔹 Get Single Product
// ==================================================

exports.getSingleProduct = async (
  id,
  userLatitude,
  userLongitude,
  userRole
) => {

  // ==================================================
  // 🔹 PRODUCT DETAILS
  // ==================================================

  const product =
    await Product.findById(id)
      .populate("brand", "name image")
      .populate("category", "name")
      .populate("subCategory", "name")
      .lean();

  if (!product) {
    throw new Error("Product not found");
  }

  // ==================================================
  // 🔥 PRODUCT CATEGORY NAME
  // ==================================================

  const productCategoryName =
    product?.category?.name;

  // ==================================================
  // 🔹 DEFAULT RESPONSE
  // ==================================================

  const responseData = {
    product
  };

  // ==================================================
  // 🔥 ONLY FOR B2C USERS
  // ==================================================

  if (
    userRole === "B2C" &&
    userLatitude &&
    userLongitude
  ) {

    try {

      // 🔹 Find Nearest B2B Shops
      let nearestShops =
        await User.aggregate([

          {
            $geoNear: {

              near: {
                type: "Point",

                coordinates: [
                  Number(userLongitude),
                  Number(userLatitude)
                ]
              },

              distanceField: "distance",

              spherical: true,

              // 🔹 10 KM Radius
              maxDistance: 10000,

              // 🔥 ONLY SAME CATEGORY + ACTIVE SUBSCRIPTION USERS
              query: {
                role: "B2B",

                categories:
                  productCategoryName,

                "subscription.isActive": true
              }
            }
          },

          {
            $project: {

              firmName: 1,
              proprietorName: 1,
              mobile: 1,
              location: 1,

              // 🔥 DISTANCE IN METERS
              distanceInMeters: {
                $round: [
                  "$distance",
                  0
                ]
              },

              // 🔥 DISTANCE IN KM
              distanceInKm: {
                $toDouble: {
                  $round: [
                    {
                      $divide: [
                        "$distance",
                        1000
                      ]
                    },
                    1
                  ]
                }
              }
            }
          },

          {
            $limit: 3
          }
        ]);

      // ==================================================
      // 🔹 FALLBACK USERS
      // ==================================================

      if (nearestShops.length === 0) {

        const fallbackUsers =
          await User.find({

            role: "B2B",

            // 🔥 SAME CATEGORY USERS
            categories:
              productCategoryName,

            // 🔥 ONLY ACTIVE SUBSCRIPTION USERS
            "subscription.isActive": true

          })
            .select(`
              firmName
              proprietorName
              mobile
              location
            `)
            .limit(3)
            .lean();

        // 🔥 MANUAL DISTANCE CALCULATION
        nearestShops =
          fallbackUsers.map(
            (shop) => {

              let distanceInKm = 0;

              if (
                shop?.location
                  ?.coordinates &&
                shop.location
                  .coordinates
                  .length === 2
              ) {

                const [
                  shopLongitude,
                  shopLatitude
                ] =
                  shop.location
                    .coordinates;

                distanceInKm =
                  Number(
                    calculateDistance(
                      Number(
                        userLatitude
                      ),
                      Number(
                        userLongitude
                      ),
                      Number(
                        shopLatitude
                      ),
                      Number(
                        shopLongitude
                      )
                    ).toFixed(1)
                  );
              }

              return {

                ...shop,

                distanceInKm,

                distanceInMeters:
                  Math.round(
                    distanceInKm *
                      1000
                  )
              };
            }
          );
      }

      // 🔹 Add Response
      responseData.nearestShops =
        nearestShops;

    } catch (error) {

      console.log(
        "Nearest shop error:",
        error.message
      );
    }
  }

  // ==================================================
  // 🔥 FOR B2B / ADMIN USERS
  // ==================================================

  if (
    (userRole === "B2B" ||
      userRole === "ADMIN") &&
    userLatitude &&
    userLongitude
  ) {

    try {

      // 🔹 Product Owner Id
      const ownerId =
        product?.createdBy;

      if (ownerId) {

        // 🔹 Get Product Owner
        const owner =
          await User.findById(ownerId)
            .select(`
              firmName
              proprietorName
              mobile
              location
              subscription
            `)
            .lean();

        if (
          owner &&
          owner?.location &&
          owner?.location?.coordinates
        ) {

          const [
            ownerLongitude,
            ownerLatitude
          ] =
            owner.location.coordinates;

          // 🔹 Calculate Distance
          const distanceInKm =
            Number(
              calculateDistance(
                Number(
                  userLatitude
                ),
                Number(
                  userLongitude
                ),
                Number(
                  ownerLatitude
                ),
                Number(
                  ownerLongitude
                )
              )
            );

          // 🔹 Add Response
          responseData.productOwner = {

            ...owner,

            // 🔥 HIDE MOBILE IF SUBSCRIPTION INACTIVE
            mobile:
              owner?.subscription
                ?.isActive
                ? owner.mobile
                : null,

            distanceInKm:
              isNaN(distanceInKm)
                ? 0
                : Number(
                    distanceInKm.toFixed(
                      1
                    )
                  ),

            distanceInMeters:
              isNaN(distanceInKm)
                ? 0
                : Math.round(
                    distanceInKm *
                      1000
                  )
          };
        }
      }

    } catch (error) {

      console.log(
        "Product owner error:",
        error.message
      );
    }
  }

  return responseData;
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

