const Subscription = require("./subscription.model");
const User = require("../auth/auth.model");

// CREATE PLAN (ADMIN)
exports.createPlan = async (data) => {
  return await Subscription.create(data);
};

// GET ALL PLANS
exports.getPlans = async () => {
  return await Subscription.find({ isActive: true });
};

// UPDATE PLAN
exports.updatePlan = async (id, data) => {
  return await Subscription.findByIdAndUpdate(id, data, { new: true });
};

// DELETE PLAN
exports.deletePlan = async (id) => {
  return await Subscription.findByIdAndDelete(id);
};

// SUBSCRIBE USER
exports.subscribeUser = async (userId, planId) => {
  const plan = await Subscription.findById(planId);
  if (!plan) throw new Error("Plan not found");

  const user = await User.findById(userId);

  // ❌ Prevent duplicate active subscription
  if (user.subscription?.isActive) {
    throw new Error("User already has active subscription");
  }

  const startDate = new Date();

  // 🧠 Handle trial
  let endDate = new Date();
  const totalDays = plan.duration + (plan.trialDays || 0);
  endDate.setDate(startDate.getDate() + totalDays);

  user.subscription = {
    planId,
    startDate,
    endDate,
    isActive: true
  };

  await user.save();

  return user;
};

// CANCEL SUBSCRIPTION
exports.cancelSubscription = async (userId) => {
  return await User.findByIdAndUpdate(
    userId,
    {
      "subscription.isActive": false
    },
    { new: true }
  );
};

exports.activateTrial = async (userId) => {
  const User = require("../user/user.model");
  const Subscription = require("./subscription.model");

  const user = await User.findById(userId);

  // ❌ Already active subscription
  if (user.subscription?.isActive) {
    throw new Error("User already has active subscription");
  }

  // 🔍 Find trial plan
  const trialPlan = await Subscription.findOne({ price: 0 });

  if (!trialPlan) {
    throw new Error("Trial plan not found");
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + trialPlan.duration);

  user.subscription = {
    planId: trialPlan._id,
    startDate,
    endDate,
    isActive: true
  };

  await user.save();

  return user;
};