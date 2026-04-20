const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const getFolder = (req) => {
  if (req.baseUrl.includes("banners")) return "banners";
  if (req.baseUrl.includes("categories")) return "categories";
  if (req.baseUrl.includes("products")) return "products";
  if (req.baseUrl.includes("brands")) return "brands";
  return "others";
};

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: `your_app/${getFolder(req)}`,
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    public_id: `${Date.now()}-${file.originalname}`,
    transformation: [
      { width: 1200, height: 600, crop: "limit" },
      { quality: "auto" },
    ],
  }),
});

module.exports = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});