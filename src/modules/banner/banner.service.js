const Banner = require("./banner.model");
const cloudinary = require("../../config/cloudinary");

// 🔹 Create Banner
exports.createBanner = async (file, userId) => {
  if (!file) throw new Error("Image is required");

  const count = await Banner.countDocuments();

  // 🔥 Auto replace oldest if limit reached
  if (count >= 5) {
    const oldest = await Banner.findOne().sort({ createdAt: 1 });

    if (oldest?.public_id) {
      await cloudinary.uploader.destroy(oldest.public_id);
    }

    await oldest.deleteOne();
  }

  return await Banner.create({
    image: file.path,
    public_id: file.filename,
    createdBy: userId,
  });
};


// 🔹 Get All
exports.getAllBanners = async () => {
  return await Banner.find().sort({ createdAt: -1 });
};


// 🔹 Update
exports.updateBanner = async (id, file) => {
  const banner = await Banner.findById(id);
  if (!banner) throw new Error("Banner not found");

  if (file) {
    if (banner.public_id) {
      await cloudinary.uploader.destroy(banner.public_id);
    }

    banner.image = file.path;
    banner.public_id = file.filename;
  }

  await banner.save();
  return banner;
};


// 🔹 Delete
exports.deleteBanner = async (id) => {
  const banner = await Banner.findById(id);
  if (!banner) throw new Error("Banner not found");

  if (banner.public_id) {
    await cloudinary.uploader.destroy(banner.public_id);
  }

  await banner.deleteOne();
  return true;
};