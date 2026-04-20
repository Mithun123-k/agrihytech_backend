// banner.service.js
const Banner = require("./banner.model");
const fs = require("fs");

// 🔹 Create Banner
exports.createBanner = async (file, userId) => {
  if (!file) {
    throw new Error("Image is required");
  }

  // 🔥 check total banners
  const count = await Banner.countDocuments();

  if (count >= 5) {
    throw new Error("Maximum 5 banners allowed");
  }

  const banner = await Banner.create({
    image: file.path,
    createdBy: userId
  });

  return banner;
};

// 🔹 Get All Banners
exports.getAllBanners = async () => {
  return await Banner.find().sort({ createdAt: -1 });
};


// 🔹 Update Banner
exports.updateBanner = async (id, file) => {
  const banner = await Banner.findById(id);

  if (!banner) {
    throw new Error("Banner not found");
  }

  // 🔥 replace image
  if (file) {
    if (banner.image && fs.existsSync(banner.image)) {
      fs.unlinkSync(banner.image);
    }

    banner.image = file.path;
  }

  await banner.save();

  return banner;
};


// 🔹 Delete Banner
exports.deleteBanner = async (id) => {
  const banner = await Banner.findById(id);

  if (!banner) {
    throw new Error("Banner not found");
  }

  // 🔥 delete image file
  if (banner.image && fs.existsSync(banner.image)) {
    fs.unlinkSync(banner.image);
  }

  await Banner.findByIdAndDelete(id);

  return true;
};