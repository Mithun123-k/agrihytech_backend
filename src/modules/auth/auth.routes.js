const express = require("express");
const router = express.Router();
const controller = require("./auth.controller");

router.post("/send-otp", controller.sendOtp);
router.post("/verify-otp", controller.verifyOtp);
router.post("/register-b2b", controller.registerB2B);

module.exports = router;