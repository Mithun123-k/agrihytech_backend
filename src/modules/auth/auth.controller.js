const authService = require("./auth.service");

// 📲 Send OTP
exports.sendOtp = async (req, res) => {
  try {
    const { mobile, role } = req.body;
    const data = await authService.sendOtp(mobile, role);
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { mobile, otp, role } = req.body;
    const data = await authService.verifyOtp(mobile, otp, role);
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 🏢 Register B2B
exports.registerB2B = async (req, res) => {
  try {
    const data = await authService.registerB2B(req.body);
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};



exports.getMe = async (req, res) => {
  try {
    const user = await authService.getMe(req.user.id);

    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /me/update
exports.updateProfile = async (req, res) => {
  try {
    const user = await authService.updateProfile(
      req.user.id,
      req.body,
      req.file
    );

    res.json({
      success: true,
      message: "Profile updated",
      user
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};