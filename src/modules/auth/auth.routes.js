const express = require("express");
const router = express.Router();
const controller = require("./auth.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const upload = require("../../middleware/upload");

router.post("/send-otp", controller.sendOtp);
router.post("/verify-otp", controller.verifyOtp);
router.post("/register-b2b", controller.registerB2B);
router.get("/me", authMiddleware, controller.getMe);
router.put("/me/update", authMiddleware, upload.single("profileimage"), controller.updateProfile);
router.post(
  "/request-delete-account",
  authMiddleware,
  controller.requestAccountDeletion
);

router.get(
  "/delete-request-users",
  authMiddleware,
  controller.getDeleteRequestUsers
);

router.delete(
  "/delete-user/:id",
  authMiddleware,
  controller.deleteUser
);

module.exports = router;