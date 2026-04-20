const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Monthly / Yearly

    // ✅ ADD HERE
    type: { 
      type: String, 
      enum: ["MONTHLY", "YEARLY"], 
      required: true 
    },

    price: { type: Number, required: true },
    duration: { type: Number, required: true }, // days (30 / 365)
    trialDays: { type: Number, default: 0 },

    features: [{ type: String }],

    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);