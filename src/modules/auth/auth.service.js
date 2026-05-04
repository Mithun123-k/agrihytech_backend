const User = require("./auth.model");
const OTP = require("./otp.model");
const bcrypt = require("bcrypt");
const cloudinary = require("../../config/cloudinary");
const client = require("../../config/twilio");
const streamifier = require("streamifier");
const fs = require("fs");

// 🔢 Generate 4 digit OTP
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// 📲 Send OTP
exports.sendOtp = async (mobile, role = "B2C") => {
  const user = await User.findOne({ mobile });

  // ❌ B2B user must register first
  if (role === "B2B" && !user) {
    throw new Error("Please register first as B2B user");
  }

  const otp = generateOTP();

  await OTP.create({
    mobile,
    otp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000)
  });

  console.log("OTP:", otp);

  // 📤 SEND SMS USING TWILIO
  // await client.messages.create({
  //   body: `Your OTP is ${otp}. It will expire in 5 minutes.`,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   to: mobile, // must be +91XXXXXXXXXX
  // });


  return { message: "OTP sent successfully", otp };
};

// ✅ Verify OTP
exports.verifyOtp = async (mobile, otp, role) => {
  const record = await OTP.findOne({ mobile, otp });

  if (!record) throw new Error("Invalid OTP");
  if (record.expiresAt < new Date()) throw new Error("OTP Expired");

  let user = await User.findOne({ mobile });

  // ✅ B2C → auto create
  if (!user && role === "B2C") {
    user = await User.create({ mobile, role: "B2C" });
  }
  // ✅ ADMIN → auto create
  if (!user && role === "ADMIN") {
    user = await User.create({ mobile, role: "ADMIN" });
  }

  // ❌ B2B must register first
  if (!user && role === "B2B") {
    throw new Error("Please register first");
  }

  user.isVerified = true;
  await user.save();

  // 🔥 USE MODEL METHOD
  const token = user.generateAuthToken();

  return { token, user };
};

// 🏢 Register B2B
exports.registerB2B = async (data) => {
  const {
    mobile,
    firmName,
    proprietorName,
    password,
    state,
    district,
    village,
    pincode,
    lat,
    lng
  } = data;

  const existing = await User.findOne({ mobile });
  if (existing) throw new Error("User already exists");

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    mobile,
    role: "B2B",
    firmName,
    proprietorName,
    password: hashedPassword,
    location: {
      state,
      district,
      village,
      pincode,
      type: "Point",
      coordinates: [lng, lat]
    }
  });

  // 🔥 USE MODEL METHOD
  const token = user.generateAuthToken();

  return {
    message: "B2B Registered Successfully",
    token,
    user
  };
};

// auth.service.js

// ✅ GET ME
exports.getMe = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user) throw new Error("User not found");
  return user;
};



// ✅ UPDATE PROFILE (without streamifier)
exports.updateProfile = async (userId, data, file) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  // ❌ restricted
  delete data.mobile;
  delete data.role;

  // parse location
  if (typeof data.location === "string") {
    data.location = JSON.parse(data.location);
  }

  // ✅ common
  if (data.name) user.name = data.name;
  if (data.email) user.email = data.email;

  // ✅ B2B
  if (user.role === "B2B") {
    if (data.firmName) user.firmName = data.firmName;
    if (data.proprietorName) user.proprietorName = data.proprietorName;

    if (data.location) {
      user.location = {
        ...user.location,
        ...data.location,
        type: "Point",
        coordinates: [
          data.location.lng || user.location.coordinates[0],
          data.location.lat || user.location.coordinates[1]
        ]
      };
    }

    if (data.password) {
      user.password = await bcrypt.hash(data.password, 10);
    }
  }

  // 🔥 IMAGE UPLOAD (NO STREAMIFIER)
  if (file && file.path) {
    // delete old image
    if (user?.public_id) {
      await cloudinary.uploader.destroy(user?.public_id);
    }


    // ✅ save new image
    user.profileimage = file.path;
    user.public_id = file.filename;

    

  }

  await user.save();

  user.password = undefined;

  return user;
};