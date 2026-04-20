// home.controller.js
const homeService = require("./home.service");

exports.getHome = async (req, res) => {
  try {

    const data = await homeService.getHomeData(req.user._id);

    res.json({
      message: "Home data fetched successfully",
      user: {
        name: req.user.name || "User"
      },
      ...data
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};