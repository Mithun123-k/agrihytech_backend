const express = require("express");
const router = express.Router();

const controller = require("./subscription.controller");
const { verifyToken, isAdmin } = require("../../middleware/isAdmin");

// ADMIN
router.post("/create", verifyToken, isAdmin, controller.createPlan);
router.put("/:id", verifyToken, isAdmin, controller.updatePlan);
router.delete("/:id", verifyToken, isAdmin, controller.deletePlan);

// USER
router.get("/", controller.getPlans);
router.post("/subscribe", verifyToken, controller.subscribe);
router.post("/cancel", verifyToken, controller.cancel);
router.post("/skip-trial", verifyToken, controller.skipTrial);

module.exports = router;