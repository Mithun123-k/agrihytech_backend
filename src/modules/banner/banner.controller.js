// banner.controller.js
const bannerService = require("./banner.service");


// 🔹 Create
exports.createBanner = async (req, res) => {
  try {
    const banner = await bannerService.createBanner(
      req.file,
      req.user._id
    );

    res.status(201).json({
      message: "Banner created successfully",
      banner
    });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


// 🔹 Get All
exports.getAllBanners = async (req, res) => {
  try {
    const banners = await bannerService.getAllBanners();

    res.json({
      message: "Banners fetched successfully",
      banners
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// 🔹 Update
exports.updateBanner = async (req, res) => {
  try {
    const banner = await bannerService.updateBanner(
      req.params.id,
      req.file
    );

    res.json({
      message: "Banner updated successfully",
      banner
    });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


// 🔹 Delete
exports.deleteBanner = async (req, res) => {
  try {
    await bannerService.deleteBanner(req.params.id);

    res.json({
      message: "Banner deleted successfully"
    });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};