const service = require("./subscription.service");

// CREATE PLAN
exports.createPlan = async (req, res) => {
  try {
    const plan = await service.createPlan(req.body);
    res.status(201).json(plan);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET ALL
exports.getPlans = async (req, res) => {
  try {
    const plans = await service.getPlans();
    res.json(plans);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// UPDATE
exports.updatePlan = async (req, res) => {
  try {
    const plan = await service.updatePlan(req.params.id, req.body);
    res.json(plan);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE
exports.deletePlan = async (req, res) => {
  try {
    await service.deletePlan(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// SUBSCRIBE USER
exports.subscribe = async (req, res) => {
  try {
    const user = await service.subscribeUser(req.user._id, req.body.planId);
    res.json({ message: "Subscribed successfully", user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// CANCEL
exports.cancel = async (req, res) => {
  try {
    const user = await service.cancelSubscription(req.user._id);
    res.json({ message: "Subscription cancelled", user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// SKIP TRIAL
exports.skipTrial = async (req, res) => {
  try {
    const user = await service.activateTrial(req.user._id);

    res.json({
      message: "7 days trial activated",
      user
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};