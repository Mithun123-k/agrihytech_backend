// product.model.js
const mongoose = require("mongoose");

const stepSchema = new mongoose.Schema({
  heading: String,
  description: String
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },

  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Brand",
    required: true
  },

  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  subCategory: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },

  description: String,
  price: Number,

  images: [String],

  quantity: Number,
  unit: String,

  brandVariant: String,
  qualityGrade: String,

  usageSteps: [stepSchema],
  keyBenefits: [String],
  suitableCrops: [String],

  specifications: {
    activeIngredient: String,
    targetPests: String,
    safetyPeriod: String,
    packSize: String,
    storage: String
  },

  safetyPrecautions: String,

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }

}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);