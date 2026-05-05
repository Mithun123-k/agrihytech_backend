const Product = require("../product/product.model");
const Brand = require("../brand/brand.model");
const Category = require("../category/category.model");

exports.globalSearch = async (query) => {
    const regex = new RegExp(query, "i");

    const [products, brands, categories] = await Promise.all([

        Product.find({
            name: { $regex: regex }
        })
            .populate("brand", "name")
            .populate("category", "name")
            .limit(10),

        Brand.find({
            name: { $regex: regex }
        }).limit(10),

        Category.find({
            name: { $regex: regex }
        }).limit(10),
    ]);

    return {
        products,
        brands,
        categories
    };
};