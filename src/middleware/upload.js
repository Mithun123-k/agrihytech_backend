const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "uploads/";

    // 🔥 dynamic folder based on route
    if (req.baseUrl.includes("categories")) {
      uploadPath += "categories";
    } else if (req.baseUrl.includes("products")) {
      uploadPath += "products";
    } else if (req.baseUrl.includes("brands")) {
      uploadPath += "brands";
    } else if (req.baseUrl.includes("banners")) {
      uploadPath += "banners";
    }
    else {
      uploadPath += "others";
    }

    // ✅ create folder if not exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

module.exports = multer({ storage });