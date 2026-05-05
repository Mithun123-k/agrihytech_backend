const mongoose = require("mongoose");
const Banner = require("../banner/banner.model");
const Category = require("../category/category.model");
const Brand = require("../brand/brand.model");

exports.getHomeData = async (userId) => {

  // 🔹 banners (max 5)
  const banners = await Banner.find()
    .sort({ createdAt: -1 })
    .limit(5);

  // 🔥 categories with brand usage (max 4)
  const categories = await Category.aggregate([
    { $sort: { createdAt: -1 } },
    { $limit: 4 },

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
        brands: 0 // optional (hide full brand data)
      }
    }
  ]);

  // 🔹 top brands (max 4)
  const brands = await Brand.aggregate([
    { $sort: { createdAt: -1 } },
    { $limit: 4 },

    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "brand",
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
        products: 0
      }
    }
  ]);


  return {
    banners,
    categories,
    brands
  };
};