const express = require("express");
const authController = require("../controllers/enduser/auth");
const authMiddleware = require("../middleware/enduser_middleware");

//admin auth middleware------------------
const authenticateUser = require("../middleware/authentication");

const router = express.Router();

//users only oparations------------------
router.post("/register", authenticateUser, authController.register);
router.post("/login", authController.login);

router.post(
  "/add-login-detail",
  authMiddleware.authenticate,
  authController.addLoginDetail
);

//admins only oparations------------------
router.post("/add-device", authenticateUser, authController.addDevice);
router.put("/edit-device", authenticateUser, authController.editDevice);
router.put("/get-devices/:userID", authenticateUser, authController.getDevices);

router.get(
  "/view-login-logs/:userId",
  authenticateUser,
  authController.viewLoginLogs
);
router.get(
  "/view-abnormal-logs",
  authenticateUser,
  authController.viewAbnormalLogs
);
router.get(
  "/view-all-login-logs",
  authenticateUser,
  authController.viewAllLoginLogs
);
router.get(
  "/view-all-abnormal-logs",
  authenticateUser,
  authController.viewAllAbnormalLogs
);

router.post(
  "/add-server-auth/",
  authenticateUser,
  authController.addServerAuth
);
router.get(
  "/get-server-auths/:userId",
  authenticateUser,
  authController.getServerAuths
);
router.put(
  "/update-server-auth/:userId",
  authenticateUser,
  authController.updateServerAuth
);

router.put("/block-user/:userId", authenticateUser, authController.blockUser);
router.put(
  "/unblock-user/:userId",
  authenticateUser,
  authController.unblockUser
);

router.get(
  "/get-user-info/:userId",
  authMiddleware.authenticate,
  authController.getUserInfo
);

router.get(
  "/get-user-info-admin/:userId",
  authenticateUser,
  authController.getUserInfo
);

router.get("/get-users", authenticateUser, authController.getUsers);

module.exports = router;
