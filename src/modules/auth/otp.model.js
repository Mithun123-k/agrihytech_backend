const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  mobile: String,
  otp: String,
  expiresAt: Date
});

module.exports = mongoose.model("OTP", otpSchema);