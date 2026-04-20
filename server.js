require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");

connectDB();

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`🌱 AgriHyTech Server running on port ${PORT}`);
});