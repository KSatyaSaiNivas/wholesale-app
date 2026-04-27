const express = require("express");

const { getAllOrders } = require("../controllers/adminController");
const { placeOrder } = require("../controllers/orderController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").post(protect, placeOrder).get(protect, adminOnly, getAllOrders);

module.exports = router;
