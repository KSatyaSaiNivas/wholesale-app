const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");

const PRODUCT_FIELDS = "name price stock";
const PAYMENT_TYPES = ["Pay Now", "Pay After Delivery"];
const DEFAULT_PAYMENT_TYPES = ["Pay Now"];

const getItemProductId = (item) =>
  item.product && item.product._id ? item.product._id.toString() : item.product.toString();

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const rollbackStockAdjustments = async (adjustments) => {
  if (!adjustments.length) {
    return;
  }

  await Promise.all(
    adjustments.map((adjustment) =>
      Product.updateOne(
        { _id: adjustment.productId },
        { $inc: { stock: adjustment.quantity } }
      )
    )
  );
};

const cleanupUnavailableItems = async (cart) => {
  if (!cart) {
    return null;
  }

  const validItems = cart.items.filter((item) => item.product);

  if (validItems.length === cart.items.length) {
    return cart;
  }

  cart.items = validItems.map((item) => ({
    product: getItemProductId(item),
    quantity: item.quantity,
  }));
  await cart.save();
  await cart.populate("items.product", PRODUCT_FIELDS);

  return cart;
};

const calculateOrderTotal = (products) =>
  Number(
    products.reduce((sum, product) => sum + product.price * product.quantity, 0).toFixed(2)
  );

const serializeOrder = (order) => ({
  ...order.toObject(),
  totalAmount: calculateOrderTotal(order.products),
});

const placeOrder = async (req, res, next) => {
  let cart;
  let cartCleared = false;
  let originalItems = [];
  const stockAdjustments = [];

  try {
    const address = typeof req.body.address === "string" ? req.body.address.trim() : "";
    const paymentType =
      typeof req.body.paymentType === "string" ? req.body.paymentType.trim() : "";
    const allowedPaymentTypes = req.user.isTrusted
      ? PAYMENT_TYPES
      : DEFAULT_PAYMENT_TYPES;

    if (address.length < 10) {
      throw createError(400, "Address must be at least 10 characters long");
    }

    if (!PAYMENT_TYPES.includes(paymentType)) {
      throw createError(400, "Payment type must be Pay Now or Pay After Delivery");
    }

    if (!allowedPaymentTypes.includes(paymentType)) {
      throw createError(
        400,
        "Pay After Delivery is only available for trusted users"
      );
    }

    cart = await Cart.findOne({ user: req.user._id }).populate("items.product", PRODUCT_FIELDS);
    cart = await cleanupUnavailableItems(cart);

    if (!cart || cart.items.length === 0) {
      throw createError(400, "Cart is empty");
    }

    originalItems = cart.items.map((item) => ({
      product: getItemProductId(item),
      quantity: item.quantity,
    }));

    for (const item of cart.items) {
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: item.product._id,
          stock: { $gte: item.quantity },
        },
        {
          $inc: { stock: -item.quantity },
        },
        {
          new: true,
        }
      );

      if (!updatedProduct) {
        throw createError(
          400,
          `${item.product.name} does not have enough stock for the requested quantity`
        );
      }

      stockAdjustments.push({
        productId: item.product._id,
        quantity: item.quantity,
      });
    }

    const orderProducts = cart.items.map((item) => ({
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.price,
    }));

    cart.items = [];
    await cart.save();
    cartCleared = true;

    const order = await Order.create({
      userId: req.user._id,
      products: orderProducts,
      address,
      paymentType,
    });

    return res.status(201).json({
      message: "Order placed successfully",
      order: serializeOrder(order),
    });
  } catch (error) {
    if (cartCleared && cart) {
      try {
        cart.items = originalItems;
        await cart.save();
      } catch (restoreCartError) {
        // Best effort restoration to avoid masking the original failure.
      }
    }

    try {
      await rollbackStockAdjustments(stockAdjustments);
    } catch (rollbackError) {
      // Best effort rollback to avoid masking the original failure.
    }

    if (error.statusCode) {
      res.status(error.statusCode);
    }

    return next(error);
  }
};

const getUserOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      count: orders.length,
      orders: orders.map(serializeOrder),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  placeOrder,
  getUserOrders,
};
