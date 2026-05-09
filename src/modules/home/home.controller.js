// home.controller.js
const homeService = require("./home.service");

exports.getHome = async (req, res) => {
  try {

    const data = await homeService.getHomeData(req.user._id);

    // console.log("Home data:", data);
    // console.log("User:", req.user);

    res.json({
      message: "Home data fetched successfully",
      user: {
        name: req.user.proprietorName || "Ramesh"
      },
      ...data
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserHomeData = async (req, res) => {
  try {
    const data = await homeService.getUserHomeData();

    res.status(200).json({
      message: "Home data fetched successfully",
      ...data
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};