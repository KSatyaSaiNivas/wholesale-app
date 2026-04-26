import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import FormField from "../components/FormField";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({
    mobileNumber: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = location.state?.from || "/";

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
      await login(form);
      navigate(redirectTo, { replace: true });
    } catch (submitError) {
      setError(submitError.message || "Unable to log you in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="panel p-6 sm:p-8 lg:p-10">
        <span className="badge-brand">Account access</span>
        <h1 className="mt-4 text-4xl font-bold text-ink">Log in and keep the shelves moving.</h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
          Your cart, checkout eligibility, and live product ordering all start here.
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

          <FormField
            autoComplete="current-password"
            label="Password"
            name="password"
            onChange={handleChange}
            placeholder="Enter password"
            type="password"
            value={form.password}
          />

          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

          <button className="btn-primary w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          New to the platform?{" "}
          <Link className="font-semibold text-brand" to="/register">
            Create an account
          </Link>
        </p>
      </div>

      <aside className="panel overflow-hidden bg-ink p-6 text-white sm:p-8 lg:p-10">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">Why teams use this</p>
          <h2 className="mt-4 text-3xl font-bold">A calmer ordering workflow for busy stores.</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-[24px] bg-white/10 p-5">
              <p className="text-sm font-semibold">Fast login on mobile</p>
              <p className="mt-2 text-sm leading-7 text-white/75">
                Big tap targets and clean forms that work well on smaller screens.
              </p>
            </div>
            <div className="rounded-[24px] bg-white/10 p-5">
              <p className="text-sm font-semibold">Cart synced to your account</p>
              <p className="mt-2 text-sm leading-7 text-white/75">
                Continue the same order from phone, tablet, or desktop.
              </p>
            </div>
            <div className="rounded-[24px] bg-white/10 p-5">
              <p className="text-sm font-semibold">Payment rules surfaced clearly</p>
              <p className="mt-2 text-sm leading-7 text-white/75">
                Trusted account perks stay visible all the way through checkout.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </section>
  );
}
