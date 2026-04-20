const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  mobile: { type: String, required: true, unique: true },

  role: { type: String, enum: ["B2C", "B2B", "ADMIN"], default: "B2C" },

  // 🔹 B2B fields
  firmName: String,
  proprietorName: String,
  password: String,

  location: {
    state: String,
    district: String,
    village: String,
    pincode: String,

    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },

  isVerified: { type: Boolean, default: false },

  // 🔥 NEW: Subscription Field
  subscription: {
    planId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
    startDate: Date,
    endDate: Date,
    isActive: { type: Boolean, default: false }
  }

}, { timestamps: true });

// ✅ INDEX
userSchema.index({ location: "2dsphere" });

// 🔐 TOKEN
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

module.exports = mongoose.model("User", userSchema);