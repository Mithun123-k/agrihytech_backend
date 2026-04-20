const User = require("./auth.model");
const OTP = require("./otp.model");
const bcrypt = require("bcrypt");

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