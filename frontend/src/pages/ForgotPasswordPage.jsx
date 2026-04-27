import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import FormField from "../components/FormField";
import { useAuth } from "../contexts/AuthContext";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { forgotPassword, resetPassword } = useAuth();
  const [form, setForm] = useState({
    mobileNumber: "",
    otp: "",
    password: "",
  });
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: name === "mobileNumber" || name === "otp" ? value.replace(/\D/g, "") : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage({ type: "", text: "" });
    setIsSubmitting(true);

    try {
      if (!isOtpStep) {
        const data = await forgotPassword({
          phone: form.mobileNumber,
          mobileNumber: form.mobileNumber,
        });
        setDevOtp(data.devOtp || "");
        setIsOtpStep(true);
        setMessage({ type: "success", text: data.message });
        return;
      }

      await resetPassword({
        phone: form.mobileNumber,
        mobileNumber: form.mobileNumber,
        otp: form.otp,
        password: form.password,
      });
      navigate("/login", { replace: true });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Unable to reset password right now.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl">
      <div className="panel p-6 sm:p-8 lg:p-10">
        <span className="badge-brand">Password reset</span>
        <h1 className="mt-4 text-4xl font-bold text-ink">Reset password with OTP.</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          Enter your registered mobile number, verify the OTP, and create a new password.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <FormField
            autoComplete="tel"
            inputMode="numeric"
            label="Mobile Number"
            name="mobileNumber"
            onChange={handleChange}
            placeholder="Enter mobile number"
            value={form.mobileNumber}
          />

          {isOtpStep ? (
            <>
              <FormField
                autoComplete="one-time-code"
                helpText={devOtp ? `Development OTP: ${devOtp}` : "Enter the OTP sent to your mobile number."}
                inputMode="numeric"
                label="OTP"
                maxLength="6"
                name="otp"
                onChange={handleChange}
                placeholder="Enter 6-digit OTP"
                value={form.otp}
              />
              <FormField
                autoComplete="new-password"
                helpText="Use 8 to 72 characters with at least one letter and one number."
                label="New Password"
                name="password"
                onChange={handleChange}
                placeholder="Create new password"
                type="password"
                value={form.password}
              />
            </>
          ) : null}

          {message.text ? (
            <p
              className={[
                "text-sm font-medium",
                message.type === "error" ? "text-red-600" : "text-aqua",
              ].join(" ")}
            >
              {message.text}
            </p>
          ) : null}

          <button className="btn-primary w-full" disabled={isSubmitting} type="submit">
            {isSubmitting
              ? isOtpStep
                ? "Resetting password..."
                : "Sending OTP..."
              : isOtpStep
                ? "Reset Password"
                : "Send OTP"}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          Remembered it?{" "}
          <Link className="font-semibold text-brand" to="/login">
            Back to login
          </Link>
        </p>
      </div>
    </section>
  );
}
