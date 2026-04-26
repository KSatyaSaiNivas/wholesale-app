const mongoose = require("mongoose");

const Order = require("../models/Order");
const User = require("../models/User");
const { sendDeliveredOrderNotification } = require("../utils/notification");

const ORDER_STATUSES = ["Pending", "Confirmed", "Shipped", "Delivered"];

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const sanitizeUser = (user) => ({
  id: user._id.toString(),
  mobileNumber: user.mobileNumber,
  isTrusted: user.isTrusted,
  isAdmin: user.isAdmin,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const serializeOrder = (order) => ({
  id: order._id.toString(),
  user: order.userId
    ? {
        id: order.userId._id.toString(),
        mobileNumber: order.userId.mobileNumber,
        isTrusted: order.userId.isTrusted,
        isAdmin: order.userId.isAdmin,
      }
    : null,
  products: order.products,
  address: order.address,
  paymentType: order.paymentType,
  status: order.status,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
});

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .select("mobileNumber isTrusted isAdmin createdAt updatedAt");

    return res.status(200).json({
      count: users.length,
      users: users.map(sanitizeUser),
    });
  } catch (error) {
    return next(error);
  }
};

const updateUserTrust = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isTrusted } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      throw createError(400, "Invalid user ID");
    }

    if (typeof isTrusted !== "boolean") {
      throw createError(400, "isTrusted must be a boolean value");
    }

    const user = await User.findById(id);

    if (!user) {
      throw createError(404, "User not found");
    }

    user.isTrusted = isTrusted;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      message: `User marked as ${isTrusted ? "Trusted" : "Not Trusted"}`,
      user: sanitizeUser(user),
    });
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode);
    }

    return next(error);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("userId", "mobileNumber isTrusted isAdmin");

    return res.status(200).json({
      count: orders.length,
      orders: orders.map(serializeOrder),
    });
  } catch (error) {
    return next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const status = typeof req.body.status === "string" ? req.body.status.trim() : "";

    if (!mongoose.isValidObjectId(id)) {
      throw createError(400, "Invalid order ID");
    }

    if (!ORDER_STATUSES.includes(status)) {
      throw createError(
        400,
        "Status must be one of Pending, Confirmed, Shipped, or Delivered"
      );
    }

    const order = await Order.findById(id).populate(
      "userId",
      "mobileNumber isTrusted isAdmin"
    );

    if (!order) {
      throw createError(404, "Order not found");
    }

    const previousStatus = order.status;
    order.status = status;
    await order.save();
    await order.populate("userId", "mobileNumber isTrusted isAdmin");

    if (previousStatus !== "Delivered" && order.status === "Delivered") {
      sendDeliveredOrderNotification({
        mobileNumber: order.userId ? order.userId.mobileNumber : null,
        orderId: order._id.toString(),
      });
    }

    return res.status(200).json({
      message: "Order status updated successfully",
      order: serializeOrder(order),
    });
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode);
    }

    return next(error);
  }
};

module.exports = {
  getAllUsers,
  updateUserTrust,
  getAllOrders,
  updateOrderStatus,
};
