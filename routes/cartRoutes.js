const express = require("express");

const {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
} = require("../controllers/cartController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").post(protect, addToCart).get(protect, getCart);
router.route("/:productId").put(protect, updateCartItem).delete(protect, removeCartItem);

module.exports = router;
