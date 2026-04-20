const User = require("../modules/auth/auth.model");

exports.checkSubscription = async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user.subscription?.isActive) {
    return res.status(403).json({ message: "No active subscription" });
  }

  if (new Date() > user.subscription.endDate) {
    user.subscription.isActive = false;
    await user.save();

    return res.status(403).json({ message: "Subscription expired" });
  }

  next();
};