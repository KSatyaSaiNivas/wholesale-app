const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const MOBILE_REGEX = /^\d{10,15}$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;

const normalizeMobileNumber = (value = "") => value.replace(/\D/g, "");

const generateOtp = () =>
  crypto.randomInt(100000, 1000000).toString().padStart(6, "0");

const hashOtp = (otp) =>
  crypto
    .createHmac("sha256", process.env.OTP_SECRET || process.env.JWT_SECRET)
    .update(String(otp))
    .digest("hex");

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const sanitizeUser = (user) => ({
  id: user._id.toString(),
  mobileNumber: user.mobileNumber,
  isTrusted: user.isTrusted,
  isAdmin: user.isAdmin,
});

const registerUser = async (req, res, next) => {
  try {
    const mobileNumber = normalizeMobileNumber(req.body.mobileNumber);
    const { password } = req.body;

    if (!MOBILE_REGEX.test(mobileNumber)) {
      return res.status(400).json({
        message: "Valid mobile number is required",
      });
    }

    if (!PASSWORD_REGEX.test(password || "")) {
      return res.status(400).json({
        message:
          "Password must be 8 to 72 characters long and include at least one letter and one number",
      });
    }

    const existingUser = await User.findOne({ mobileNumber });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists with this mobile number",
      });
    }

    const user = await User.create({
      mobileNumber,
      password,
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: sanitizeUser(user),
      token: generateToken(user._id),
    });
  } catch (error) {
    return next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const mobileNumber = normalizeMobileNumber(req.body.mobileNumber);
    const { password } = req.body;

    if (!MOBILE_REGEX.test(mobileNumber) || !password) {
      return res.status(400).json({
        message: "Mobile number and password are required",
      });
    }

    const user = await User.findOne({ mobileNumber }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid mobile number or password",
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid mobile number or password",
      });
    }

    if (user.isAdmin) {
      return res.status(403).json({
        message: "Admin accounts must use the admin login page",
      });
    }

    return res.status(200).json({
      message: "Login successful",
      user: sanitizeUser(user),
      token: generateToken(user._id),
    });
  } catch (error) {
    return next(error);
  }
};

const loginAdmin = async (req, res, next) => {
  try {
    const mobileNumber = normalizeMobileNumber(req.body.mobileNumber);
    const { password } = req.body;

    if (!MOBILE_REGEX.test(mobileNumber) || !password) {
      return res.status(400).json({
        message: "Admin mobile number and password are required",
      });
    }

    const user = await User.findOne({ mobileNumber }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid admin mobile number or password",
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid admin mobile number or password",
      });
    }

    if (!user.isAdmin) {
      return res.status(403).json({
        message: "Only admin accounts can use this login page",
      });
    }

    return res.status(200).json({
      message: "Admin login successful",
      user: sanitizeUser(user),
      token: generateToken(user._id),
    });
  } catch (error) {
    return next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const mobileNumber = normalizeMobileNumber(req.body.mobileNumber);

    if (!MOBILE_REGEX.test(mobileNumber)) {
      return res.status(400).json({
        message: "Valid mobile number is required",
      });
    }

    const user = await User.findOne({ mobileNumber });

    if (!user) {
      return res.status(200).json({
        message:
          "If the mobile number is registered, a password reset OTP will be sent shortly",
      });
    }

    const otp = generateOtp();
    user.setPasswordResetOtp(otp);
    await user.save({ validateBeforeSave: false });

    // Integrate an SMS provider here to deliver the OTP securely.
    return res.status(200).json({
      message:
        "If the mobile number is registered, a password reset OTP will be sent shortly",
    });
  } catch (error) {
    return next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const mobileNumber = normalizeMobileNumber(req.body.mobileNumber);
    const otp = String(req.body.otp || "").trim();
    const newPassword = req.body.newPassword || "";

    if (!MOBILE_REGEX.test(mobileNumber) || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        message: "Valid mobile number and 6-digit OTP are required",
      });
    }

    if (!PASSWORD_REGEX.test(newPassword)) {
      return res.status(400).json({
        message:
          "New password must be 8 to 72 characters long and include at least one letter and one number",
      });
    }

    const hashedOtp = hashOtp(otp);

    const user = await User.findOne({ mobileNumber }).select(
      "+password +passwordResetOtpHash +passwordResetOtpExpiresAt"
    );

    if (
      !user ||
      !user.passwordResetOtpHash ||
      user.passwordResetOtpHash !== hashedOtp ||
      !user.passwordResetOtpExpiresAt ||
      user.passwordResetOtpExpiresAt.getTime() < Date.now()
    ) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    user.password = newPassword;
    user.clearPasswordResetOtp();
    await user.save();

    return res.status(200).json({
      message: "Password reset successful",
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  loginAdmin,
  forgotPassword,
  resetPassword,
};
