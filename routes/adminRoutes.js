const express = require("express");

const {
  getAllUsers,
  updateUserTrust,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, adminOnly);

router.get("/users", getAllUsers);
router.put("/user/:id/trust", updateUserTrust);
router.get("/orders", getAllOrders);
router.put("/order/:id/status", updateOrderStatus);

module.exports = router;
