const User = require("./auth.model");
const OTP = require("./otp.model");
const bcrypt = require("bcrypt");
const cloudinary = require("../../config/cloudinary");
const client = require("../../config/twilio");
const streamifier = require("streamifier");
const fs = require("fs");
const axios = require("axios");

// 🔢 Generate 4 digit OTP
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};



  // 📤 SEND SMS USING TWILIO
  // await client.messages.create({
  //   body: `Your OTP is ${otp}. It will expire in 5 minutes.`,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   to: `+91${mobile}`, // must be +91XXXXXXXXXX
  // });


// 📲 Send OTP
// 📲 Send OTP
exports.sendOtp = async (mobile, role = "B2C") => {
  const user = await User.findOne({ mobile });

  // New user allowed only for B2C
  if (!user && role !== "B2C") {
    throw new Error(`${role} user must register first`);
  }

  // If logging in as B2B, allow both B2B and ADMIN
  if (
    user &&
    role === "B2B" &&
    user.role !== "B2B" &&
    user.role !== "ADMIN"
  ) {
    throw new Error(
      `This mobile number is registered as ${user.role}. Please login with correct role.`
    );
  }

  // Normal mismatch check for other roles
  if (
    user &&
    role !== "B2B" &&
    user.role !== role
  ) {
    throw new Error(
      `This mobile number is registered as ${user.role}. Please login with correct role.`
    );
  }

  const otp = generateOTP();

  // 📤 SEND SMS USING TWILIO
  // await client.messages.create({
  //   body: `Your OTP is ${otp}. It will expire in 5 minutes.`,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   to: `+91${mobile}`, // must be +91XXXXXXXXXX
  // });


  await OTP.create({
    mobile,
    otp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  // console.log("OTP:", otp);

  return {
    message: "OTP sent successfully",
    otp,
  };
};

// ✅ Verify OTP
exports.verifyOtp = async (mobile, otp, role) => {
  const record = await OTP.findOne({ mobile, otp });

  if (!record) throw new Error("Invalid OTP");
  if (record.expiresAt < new Date()) throw new Error("OTP Expired");

  let user = await User.findOne({ mobile });

  // New user allowed only for B2C
  if (!user) {
    if (role === "B2C") {
      user = await User.create({
        mobile,
        role: "B2C",
        isVerified: true,
      });
    } else {
      throw new Error(`${role} user must register first`);
    }
  }

  // Special case: B2B login allows both B2B and ADMIN
  if (
    role === "B2B" &&
    user.role !== "B2B" &&
    user.role !== "ADMIN"
  ) {
    throw new Error(`This number belongs to ${user.role}`);
  }

  // Normal role mismatch check
  if (
    role !== "B2B" &&
    user.role !== role
  ) {
    throw new Error(`This number belongs to ${user.role}`);
  }

  user.isVerified = true;
  await user.save();

  const token = user.generateAuthToken();

  await OTP.deleteOne({ _id: record._id });

  return { token, user };
};


// User Register
exports.registerB2B = async (data) => {

  const {
    mobile,
    firmName,
    proprietorName,
    password,
    state,
    district,
    village,
    pincode
  } = data;

  const existing = await User.findOne({ mobile });

  if (existing) {
    throw new Error("User already exists");
  }

  // 🔹 Get Lat/Lng from Pincode
  let lat = 0;
  let lng = 0;

  try {

    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          postalcode: pincode,
          country: "India",
          format: "json",
          limit: 1
        },
        headers: {
          "User-Agent": "your-app-name"
        }
      }
    );

    if (
      response.data &&
      response.data.length > 0
    ) {

      lat = parseFloat(response.data[0].lat);
      lng = parseFloat(response.data[0].lon);
    }

  } catch (error) {

    // console.log(
    //   "Pincode location error:",
    //   error.message
    // );
  }

  // 🔹 Hash Password
  const hashedPassword =
    await bcrypt.hash(password, 10);

  // 🔹 Create User
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

  // 🔹 Generate Token
  const token = user.generateAuthToken();

  return {
    message:
      "B2B Registered Successfully",

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



// // ✅ UPDATE PROFILE (without streamifier)
// exports.updateProfile = async (userId, data, file) => {
//   const user = await User.findById(userId);
//   if (!user) throw new Error("User not found");

//   // ❌ restricted
//   delete data.mobile;
//   delete data.role;

//   // parse location
//   if (typeof data.location === "string") {
//     data.location = JSON.parse(data.location);
//   }

//   // ✅ common
//   if (data.name) user.name = data.name;
//   if (data.email) user.email = data.email;
//   if (data.proprietorName) user.proprietorName = data.proprietorName;

//   // ✅ B2B
//   if (user.role === "ADMIN" || user.role === "B2B") {
//     if (data.firmName) user.firmName = data.firmName;

//     if (data.location) {
//       user.location = {
//         ...user.location,
//         ...data.location,
//         type: "Point",
//         coordinates: [
//           data.location.lng || user.location.coordinates[0],
//           data.location.lat || user.location.coordinates[1]
//         ]
//       };
//     }

//     if (data.password) {
//       user.password = await bcrypt.hash(data.password, 10);
//     }
//   }



//   // 🔥 IMAGE UPLOAD (NO STREAMIFIER)
//   if (file && file.path) {
//     // delete old image
//     if (user?.public_id) {
//       await cloudinary.uploader.destroy(user?.public_id);
//     }


//     // ✅ save new image
//     user.profileimage = file.path;
//     user.public_id = file.filename;



//   }

//   await user.save();

//   user.password = undefined;

//   return user;
// };



// ✅ UPDATE PROFILE
exports.updateProfile = async (
  userId,
  data,
  file
) => {

  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  // ❌ restricted
  delete data.mobile;
  delete data.role;

  // 🔹 Parse Location
  if (
    typeof data.location === "string"
  ) {
    data.location =
      JSON.parse(data.location);
  }

  // ✅ Common
  if (data.name) {
    user.name = data.name;
  }

  if (data.email) {
    user.email = data.email;
  }

  if (data.proprietorName) {
    user.proprietorName =
      data.proprietorName;
  }

  // ✅ ADMIN / B2B
  if (
    user.role === "ADMIN" ||
    user.role === "B2B"
  ) {

    if (data.firmName) {
      user.firmName = data.firmName;
    }

    // 🔥 LOCATION UPDATE
    if (data.location) {

      let lat =
        data.location.lat ||
        user?.location?.coordinates?.[1];

      let lng =
        data.location.lng ||
        user?.location?.coordinates?.[0];

      // 🔥 IF LAT/LNG NOT AVAILABLE
      // THEN GET FROM PINCODE
      if (
        (!lat || !lng) &&
        data.location.pincode
      ) {

        try {

          const response =
            await axios.get(
              "https://nominatim.openstreetmap.org/search",
              {
                params: {
                  postalcode:
                    data.location.pincode,
                  country: "India",
                  format: "json",
                  limit: 1
                },
                headers: {
                  "User-Agent":
                    "your-app-name"
                }
              }
            );

          if (
            response.data &&
            response.data.length > 0
          ) {

            lat = parseFloat(
              response.data[0].lat
            );

            lng = parseFloat(
              response.data[0].lon
            );
          }

        } catch (error) {

          // console.log(
          //   "Pincode location error:",
          //   error.message
          // );
        }
      }

      // ✅ Final Location Save
      user.location = {
        ...user.location,
        ...data.location,

        type: "Point",

        coordinates: [
          lng || 0,
          lat || 0
        ]
      };
    }

    // 🔥 PASSWORD UPDATE
    if (data.password) {

      user.password =
        await bcrypt.hash(
          data.password,
          10
        );
    }
  }

  // 🔥 IMAGE UPLOAD
  if (file && file.path) {

    // delete old image
    if (user?.public_id) {

      await cloudinary.uploader.destroy(
        user.public_id
      );
    }

    // save new image
    user.profileimage = file.path;
    user.public_id = file.filename;
  }

  // ✅ SAVE
  await user.save();

  user.password = undefined;

  return user;
};