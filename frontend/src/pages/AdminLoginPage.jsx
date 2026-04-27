import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import FormField from "../components/FormField";
import { useAuth } from "../contexts/AuthContext";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { adminLogin } = useAuth();
  const [form, setForm] = useState({
    mobileNumber: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = location.state?.from || "/admin";

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: name === "mobileNumber" ? value.replace(/\D/g, "") : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await adminLogin(form);
      navigate(redirectTo, { replace: true });
    } catch (submitError) {
      setError(submitError.message || "Unable to log you in as admin.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="panel bg-ink p-6 text-white sm:p-8 lg:p-10">
        <span className="badge-aqua">Admin access</span>
        <h1 className="mt-4 text-4xl font-bold">Admin login</h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-white/75">
          Sign in here to manage orders, customer trust settings, and product operations.
        </p>

        <div className="mt-8 grid gap-4">
          <div className="rounded-[24px] bg-white/10 p-5">
            <p className="text-sm font-semibold">Private admin entry</p>
            <p className="mt-2 text-sm leading-7 text-white/75">
              User login and registration stay separate from admin access.
            </p>
          </div>
          <div className="rounded-[24px] bg-white/10 p-5">
            <p className="text-sm font-semibold">Admin-only routing</p>
            <p className="mt-2 text-sm leading-7 text-white/75">
              Non-admin accounts are signed out if they try to enter from this page.
            </p>
          </div>
        </div>
      </div>

      <div className="panel p-6 sm:p-8 lg:p-10">
        <span className="badge-brand">Restricted</span>
        <h2 className="mt-4 text-3xl font-bold text-ink">Enter admin credentials.</h2>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <FormField
            autoComplete="tel"
            inputMode="numeric"
            label="Admin Mobile Number"
            name="mobileNumber"
            onChange={handleChange}
            placeholder="Enter admin mobile number"
            value={form.mobileNumber}
          />

          <FormField
            autoComplete="current-password"
            label="Admin Password"
            name="password"
            onChange={handleChange}
            placeholder="Enter admin password"
            type="password"
            value={form.password}
          />

          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

          <button className="btn-primary w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Checking admin access..." : "Login as Admin"}
          </button>
        </form>
      </div>
    </section>
  );
}
