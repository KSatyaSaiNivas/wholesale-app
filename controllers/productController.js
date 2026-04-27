const mongoose = require("mongoose");

const Product = require("../models/Product");

const isDefined = (value) => typeof value !== "undefined";

const createProduct = async (req, res, next) => {
  try {
    const { name, price, stock, category, imageUrl } = req.body;

    const product = await Product.create({
      name,
      price,
      stock,
      ...(category ? { category } : {}),
      ...(imageUrl ? { imageUrl } : {}),
    });

    return res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    return next(error);
  }
};

const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    return res.status(200).json({
      count: products.length,
      products,
    });
  } catch (error) {
    return next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const allowedFields = ["name", "price", "stock", "category", "imageUrl"];
    const providedFields = allowedFields.filter((field) => isDefined(req.body[field]));

    if (providedFields.length === 0) {
      return res.status(400).json({
        message: "At least one product field is required for update",
      });
    }

    providedFields.forEach((field) => {
      product[field] = req.body[field];
    });

    await product.save();

    return res.status(200).json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    await product.deleteOne();

    return res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
};
