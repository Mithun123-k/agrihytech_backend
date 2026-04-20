const express = require("express");
const cors = require("cors");

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// ✅ Routes Import
const authRoutes = require("./modules/auth/auth.routes");
const categoryRoutes = require("./modules/category/category.routes");
const productRoutes = require("./modules/product/product.routes");
const brandRoutes = require('./modules/brand/brand.routes')
const bannerRoutes = require('./modules/banner/banner.routes')
const homeRoutes = require('./modules/home/home.routes')
const subscriptionRoutes = require('./modules/subscription/subscription.routes')

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/brands", brandRoutes)
app.use("/api/banners", bannerRoutes)
app.use("/api/home", homeRoutes)
app.use("/api/subscription", subscriptionRoutes)




// ✅ Health Check
app.get("/", (req, res) => {
  res.send("🌱 AgriHyTech API Running...");
});

// ❌ 404 Handler (Important)
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ❌ Global Error Handler (Very Important)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong",
    error: err.message
  });
});

module.exports = app;