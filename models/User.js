const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const OTP_EXPIRY_MS = 5 * 60 * 1000;

const normalizeMobileNumber = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value.replace(/\D/g, "");
};

const hashOtp = (otp) =>
  crypto
    .createHmac("sha256", process.env.OTP_SECRET || process.env.JWT_SECRET)
    .update(String(otp))
    .digest("hex");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 80,
      default: "Customer",
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      set: normalizeMobileNumber,
      validate: {
        validator: (value) => !value || /^\d{10,15}$/.test(value),
        message: "Phone number must contain 10 to 15 digits",
      },
    },
    mobileNumber: {
      type: String,
      required: [true, "Mobile number is required"],
      unique: true,
      trim: true,
      set: normalizeMobileNumber,
      validate: {
        validator: (value) => /^\d{10,15}$/.test(value),
        message: "Mobile number must contain 10 to 15 digits",
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      maxlength: 72,
      select: false,
    },
    isTrusted: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpires: {
      type: Date,
      select: false,
    },
    passwordResetOtpHash: {
      type: String,
      select: false,
    },
    passwordResetOtpExpiresAt: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("validate", function syncPhoneFields() {
  if (!this.phone && this.mobileNumber) {
    this.phone = this.mobileNumber;
  }

  if (!this.mobileNumber && this.phone) {
    this.mobileNumber = this.phone;
  }
});

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.setPasswordResetOtp = function setPasswordResetOtp(otp) {
  this.otp = String(otp);
  this.otpExpires = new Date(Date.now() + OTP_EXPIRY_MS);
  this.passwordResetOtpHash = hashOtp(otp);
  this.passwordResetOtpExpiresAt = this.otpExpires;
};

userSchema.methods.clearPasswordResetOtp = function clearPasswordResetOtp() {
  this.otp = undefined;
  this.otpExpires = undefined;
  this.passwordResetOtpHash = undefined;
  this.passwordResetOtpExpiresAt = undefined;
};

userSchema.methods.setOtp = function setOtp(otp) {
  this.otp = String(otp);
  this.otpExpires = new Date(Date.now() + OTP_EXPIRY_MS);
};

userSchema.methods.clearOtp = function clearOtp() {
  this.otp = undefined;
  this.otpExpires = undefined;
};

module.exports = mongoose.model("User", userSchema);
