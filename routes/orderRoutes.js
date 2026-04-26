const express = require("express");

const { placeOrder, getUserOrders } = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").post(protect, placeOrder).get(protect, getUserOrders);

module.exports = router;
