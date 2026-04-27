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
  name: user.name,
  phone: user.phone || user.mobileNumber,
  mobileNumber: user.mobileNumber,
  isTrusted: user.isTrusted,
  isAdmin: user.isAdmin,
  isVerified: user.isVerified,
});

const sendOtp = ({ phone, otp, purpose }) => {
  // Replace this with Twilio, MSG91, or another SMS provider in production.
  console.log(`[OTP:${purpose}] ${phone} -> ${otp}`);
};

const buildOtpResponse = (message, otp) => ({
  message,
  requiresOtp: true,
  ...(process.env.NODE_ENV === "production" ? {} : { devOtp: otp }),
});

const registerUser = async (req, res, next) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const mobileNumber = normalizeMobileNumber(req.body.phone || req.body.mobileNumber);
    const { password } = req.body;

    if (name.length < 2) {
      return res.status(400).json({
        message: "Name must be at least 2 characters long",
      });
    }

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

    const existingUser = await User.findOne({
      $or: [{ mobileNumber }, { phone: mobileNumber }],
    }).select("+otp +otpExpires");

    if (existingUser?.isVerified) {
      return res.status(409).json({
        message: "User already exists with this mobile number",
      });
    }

    const otp = generateOtp();

    if (existingUser) {
      existingUser.name = name;
      existingUser.phone = mobileNumber;
      existingUser.mobileNumber = mobileNumber;
      existingUser.password = password;
      existingUser.isVerified = false;
      existingUser.setOtp(otp);
      await existingUser.save();
    } else {
      const user = new User({
        name,
        phone: mobileNumber,
        mobileNumber,
        password,
        isVerified: false,
      });
      user.setOtp(otp);
      await user.save();
    }

    sendOtp({ phone: mobileNumber, otp, purpose: "registration" });

    return res.status(200).json(
      buildOtpResponse("OTP sent to your mobile number. Verify it to complete registration.", otp)
    );
  } catch (error) {
    return next(error);
  }
};

const verifyRegistration = async (req, res, next) => {
  try {
    const mobileNumber = normalizeMobileNumber(req.body.phone || req.body.mobileNumber);
    const otp = String(req.body.otp || "").trim();

    if (!MOBILE_REGEX.test(mobileNumber) || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        message: "Valid mobile number and 6-digit OTP are required",
      });
    }

    const user = await User.findOne({
      $or: [{ mobileNumber }, { phone: mobileNumber }],
    }).select("+otp +otpExpires");

    if (
      !user ||
      user.otp !== otp ||
      !user.otpExpires ||
      user.otpExpires.getTime() < Date.now()
    ) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    user.isVerified = true;
    user.clearOtp();
    await user.save({ validateBeforeSave: false });

    return res.status(201).json({
      message: "Registration verified successfully",
      user: sanitizeUser(user),
      token: generateToken(user._id),
    });
  } catch (error) {
    return next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const mobileNumber = normalizeMobileNumber(req.body.phone || req.body.mobileNumber);
    const { password } = req.body;

    if (!MOBILE_REGEX.test(mobileNumber) || !password) {
      return res.status(400).json({
        message: "Mobile number and password are required",
      });
    }

    const user = await User.findOne({
      $or: [{ mobileNumber }, { phone: mobileNumber }],
    }).select("+password");

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

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your mobile number before logging in",
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

const forgotPassword = async (req, res, next) => {
  try {
    const mobileNumber = normalizeMobileNumber(req.body.phone || req.body.mobileNumber);

    if (!MOBILE_REGEX.test(mobileNumber)) {
      return res.status(400).json({
        message: "Valid mobile number is required",
      });
    }

    const user = await User.findOne({
      $or: [{ mobileNumber }, { phone: mobileNumber }],
    });

    if (!user) {
      return res.status(200).json({
        message:
          "If the mobile number is registered, a password reset OTP will be sent shortly",
      });
    }

    const otp = generateOtp();
    user.setPasswordResetOtp(otp);
    await user.save({ validateBeforeSave: false });

    sendOtp({ phone: mobileNumber, otp, purpose: "password-reset" });

    return res.status(200).json(
      buildOtpResponse(
        "If the mobile number is registered, a password reset OTP will be sent shortly",
        otp
      )
    );
  } catch (error) {
    return next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const mobileNumber = normalizeMobileNumber(req.body.phone || req.body.mobileNumber);
    const otp = String(req.body.otp || "").trim();
    const newPassword = req.body.newPassword || req.body.password || "";

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

    const user = await User.findOne({
      $or: [{ mobileNumber }, { phone: mobileNumber }],
    }).select("+password +otp +otpExpires +passwordResetOtpHash +passwordResetOtpExpiresAt");

    if (
      !user ||
      !user.otp ||
      user.otp !== otp ||
      !user.otpExpires ||
      user.otpExpires.getTime() < Date.now()
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
  verifyRegistration,
  loginUser,
  forgotPassword,
  resetPassword,
};
