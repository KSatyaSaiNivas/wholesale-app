const mongoose = require("mongoose");

const Cart = require("../models/Cart");
const Product = require("../models/Product");

const PRODUCT_FIELDS = "name price stock category imageUrl";

const getItemProductId = (item) =>
  item.product && item.product._id ? item.product._id.toString() : item.product.toString();

const parseQuantity = (value) => Number(value);

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const buildEmptyCart = (userId) => ({
  userId: userId.toString(),
  items: [],
  totalItems: 0,
  totalAmount: 0,
});

const buildCartResponse = (cart) => {
  const items = cart.items
    .filter((item) => item.product)
    .map((item) => ({
      productId: item.product._id.toString(),
      name: item.product.name,
      price: item.product.price,
      stock: item.product.stock,
      category: item.product.category,
      imageUrl: item.product.imageUrl,
      quantity: item.quantity,
      lineTotal: Number((item.product.price * item.quantity).toFixed(2)),
    }));

  return {
    id: cart._id.toString(),
    userId: cart.user.toString(),
    items,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    totalAmount: Number(
      items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)
    ),
  };
};

const populateCart = (cartQuery) => cartQuery.populate("items.product", PRODUCT_FIELDS);

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

const addToCart = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const quantity = parseQuantity(req.body.quantity);

    if (!mongoose.isValidObjectId(productId)) {
      throw createError(400, "Valid product ID is required");
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      throw createError(400, "Quantity must be a whole number greater than 0");
    }

    const product = await Product.findById(productId);

    if (!product) {
      throw createError(404, "Product not found");
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({
        user: req.user._id,
        items: [],
      });
    }

    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      const updatedQuantity = existingItem.quantity + quantity;

      if (updatedQuantity > product.stock) {
        throw createError(400, "Requested quantity exceeds available stock");
      }

      existingItem.quantity = updatedQuantity;
    } else {
      if (quantity > product.stock) {
        throw createError(400, "Requested quantity exceeds available stock");
      }

      cart.items.push({
        product: product._id,
        quantity,
      });
    }

    await cart.save();
    await cart.populate("items.product", PRODUCT_FIELDS);

    return res.status(200).json({
      message: "Cart updated successfully",
      cart: buildCartResponse(cart),
    });
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode);
    }

    return next(error);
  }
};

const getCart = async (req, res, next) => {
  try {
    let cart = await populateCart(Cart.findOne({ user: req.user._id }));
    cart = await cleanupUnavailableItems(cart);

    if (!cart) {
      return res.status(200).json({
        cart: buildEmptyCart(req.user._id),
      });
    }

    return res.status(200).json({
      cart: buildCartResponse(cart),
    });
  } catch (error) {
    return next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const quantity = parseQuantity(req.body.quantity);

    if (!mongoose.isValidObjectId(productId)) {
      throw createError(400, "Valid product ID is required");
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      throw createError(400, "Quantity must be a whole number greater than 0");
    }

    const product = await Product.findById(productId);

    if (!product) {
      throw createError(404, "Product not found");
    }

    if (quantity > product.stock) {
      throw createError(400, "Requested quantity exceeds available stock");
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      throw createError(404, "Cart not found");
    }

    const cartItem = cart.items.find((item) => item.product.toString() === productId);

    if (!cartItem) {
      throw createError(404, "Product not found in cart");
    }

    cartItem.quantity = quantity;
    await cart.save();
    await cart.populate("items.product", PRODUCT_FIELDS);

    return res.status(200).json({
      message: "Cart item updated successfully",
      cart: buildCartResponse(cart),
    });
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode);
    }

    return next(error);
  }
};

const removeCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      throw createError(400, "Valid product ID is required");
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      throw createError(404, "Cart not found");
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter((item) => item.product.toString() !== productId);

    if (cart.items.length === initialLength) {
      throw createError(404, "Product not found in cart");
    }

    await cart.save();
    await cart.populate("items.product", PRODUCT_FIELDS);

    return res.status(200).json({
      message: "Item removed from cart successfully",
      cart: buildCartResponse(cart),
    });
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode);
    }

    return next(error);
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
};
