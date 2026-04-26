import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import FormField from "../components/FormField";
import { useAuth } from "../contexts/AuthContext";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    mobileNumber: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      await register(form);
      navigate("/", { replace: true });
    } catch (submitError) {
      setError(submitError.message || "Unable to register right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="panel overflow-hidden bg-gradient-to-br from-aqua/15 via-white to-brand/10 p-6 sm:p-8 lg:p-10">
        <span className="badge-aqua">Create account</span>
        <h1 className="mt-4 text-4xl font-bold text-ink">Open a wholesale buying account.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
          Register once, start ordering immediately, and let admin trust settings unlock more
          flexible payment options over time.
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
            autoComplete="new-password"
            helpText="Use 8 to 72 characters with at least one letter and one number."
            label="Password"
            name="password"
            onChange={handleChange}
            placeholder="Create password"
            type="password"
            value={form.password}
          />

          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

          <button className="btn-primary w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          Already have an account?{" "}
          <Link className="font-semibold text-brand" to="/login">
            Login here
          </Link>
        </p>
      </div>

      <aside className="panel p-6 sm:p-8 lg:p-10">
        <div className="space-y-5">
          <span className="badge-brand">What happens next</span>
          <div className="panel-muted p-5">
            <p className="text-sm font-semibold text-ink">1. Start ordering right away</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Browse products, build the cart, and use Pay Now immediately after signup.
            </p>
          </div>
          <div className="panel-muted p-5">
            <p className="text-sm font-semibold text-ink">2. Grow into trusted-buyer access</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Admins can mark reliable customers as trusted and unlock Pay After Delivery.
            </p>
          </div>
          <div className="panel-muted p-5">
            <p className="text-sm font-semibold text-ink">3. Keep orders moving anywhere</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              The same frontend adapts smoothly across phone, tablet, and desktop layouts.
            </p>
          </div>
        </div>
      </aside>
    </section>
  );
}
