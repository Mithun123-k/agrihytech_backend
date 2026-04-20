// home.service.js
const Banner = require("../banner/banner.model");
const Category = require("../category/category.model");
const Brand = require("../brand/brand.model");

exports.getHomeData = async (userId) => {

  // 🔹 banners (max 5)
  const banners = await Banner.find()
    .sort({ createdAt: -1 })
    .limit(5);

  // 🔹 top categories (max 4)
  const categories = await Category.find()
    .sort({ createdAt: -1 })
    .limit(4);

  // 🔹 top brands (max 4)
  const brands = await Brand.find()
    .sort({ createdAt: -1 })
    .limit(4);

  return {
    banners,
    categories,
    brands
  };
};