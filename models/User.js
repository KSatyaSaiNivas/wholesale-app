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
    isAdmin: {
      type: Boolean,
      default: false,
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
  this.passwordResetOtpHash = hashOtp(otp);
  this.passwordResetOtpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
};

userSchema.methods.clearPasswordResetOtp = function clearPasswordResetOtp() {
  this.passwordResetOtpHash = undefined;
  this.passwordResetOtpExpiresAt = undefined;
};

module.exports = mongoose.model("User", userSchema);
