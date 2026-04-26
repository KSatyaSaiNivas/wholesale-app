import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import FormField from "../components/FormField";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { formatCurrency } from "../utils/formatters";

const paymentOptions = [
  {
    label: "Pay Now",
    value: "Pay Now",
    description: "Available for every user by default.",
  },
  {
    label: "Pay After Delivery",
    value: "Pay After Delivery",
    description: "Reserved for trusted buyers approved by admin.",
  },
];

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cart, isLoading, placeOrder } = useCart();
  const [form, setForm] = useState({
    address: "",
    paymentType: "Pay Now",
  });
  const [error, setError] = useState("");
  const [successOrder, setSuccessOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.isTrusted && form.paymentType !== "Pay Now") {
      setForm((current) => ({
        ...current,
        paymentType: "Pay Now",
      }));
    }
  }, [form.paymentType, user?.isTrusted]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!cart.items.length) {
      setError("Your cart is empty.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const data = await placeOrder(form);
      setSuccessOrder(data.order);
      setForm({
        address: "",
        paymentType: "Pay Now",
      });
    } catch (submitError) {
      setError(submitError.message || "Unable to place order.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (successOrder) {
    return (
      <section className="panel p-8 sm:p-10">
        <span className="badge-aqua">Order confirmed</span>
        <h1 className="mt-4 text-4xl font-bold text-ink">Order placed successfully.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
          Your order is now in the system with an initial status of{" "}
          <span className="font-semibold text-ink">{successOrder.status}</span>.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="panel-muted p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Order ID</p>
            <p className="mt-2 break-all text-sm font-semibold text-ink">{successOrder._id}</p>
          </div>
          <div className="panel-muted p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Payment</p>
            <p className="mt-2 text-lg font-bold text-ink">{successOrder.paymentType}</p>
          </div>
          <div className="panel-muted p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Total</p>
            <p className="mt-2 text-lg font-bold text-ink">
              {formatCurrency(successOrder.totalAmount)}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link className="btn-primary" to="/">
            Back to products
          </Link>
          <button
            className="btn-secondary"
            onClick={() => setSuccessOrder(null)}
            type="button"
          >
            Place another order
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <section className="panel grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_0.9fr] lg:p-10">
        <div>
          <span className="badge-brand">Checkout</span>
          <h1 className="mt-4 text-4xl font-bold text-ink">Confirm delivery details.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            Finalise the address, review payment eligibility, and submit the order in one pass.
          </p>
        </div>

        <div className="rounded-[26px] bg-ink p-6 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">Account status</p>
          <p className="mt-3 text-lg font-semibold">
            {user?.isTrusted
              ? "Trusted buyer unlocked: Pay Now and Pay After Delivery are both available."
              : "Default rule active: this account can currently check out with Pay Now only."}
          </p>
        </div>
      </section>

      {isLoading && !cart.items.length ? (
        <div className="panel p-8 text-center sm:p-10">
          <h2 className="text-3xl font-bold text-ink">Preparing checkout</h2>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Fetching the latest cart contents before you place the order.
          </p>
        </div>
      ) : null}

      {!cart.items.length && !isLoading ? (
        <div className="panel p-8 text-center sm:p-10">
          <h2 className="text-3xl font-bold text-ink">Your cart is empty</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
            Add products to your cart before moving into checkout.
          </p>
          <Link className="btn-primary mt-6" to="/">
            Browse products
          </Link>
        </div>
      ) : !isLoading ? (
        <section className="grid gap-6 xl:grid-cols-[1fr_0.92fr]">
          <form className="panel space-y-6 p-6 sm:p-8" onSubmit={handleSubmit}>
            <FormField
              helpText="Delivery address should include enough detail for store drop-off."
              label="Delivery Address"
              multiline
              name="address"
              onChange={handleChange}
              placeholder="Shop name, street, area, city, landmark"
              value={form.address}
            />

            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-ink">Payment Type</p>
                <p className="mt-1 text-sm text-slate-500">
                  The backend validates this selection again before the order is created.
                </p>
              </div>

              <div className="grid gap-3">
                {paymentOptions.map((option) => {
                  const disabled = option.value === "Pay After Delivery" && !user?.isTrusted;

                  return (
                    <label
                      className={[
                        "panel-muted flex cursor-pointer items-start gap-4 p-5 transition",
                        disabled ? "opacity-60" : "hover:border-brand/40",
                      ].join(" ")}
                      key={option.value}
                    >
                      <input
                        checked={form.paymentType === option.value}
                        className="mt-1 h-4 w-4 accent-brand"
                        disabled={disabled}
                        name="paymentType"
                        onChange={handleChange}
                        type="radio"
                        value={option.value}
                      />
                      <div>
                        <p className="font-semibold text-ink">{option.label}</p>
                        <p className="mt-1 text-sm leading-7 text-slate-500">
                          {option.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

            <button className="btn-primary w-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Placing order..." : "Place order"}
            </button>
          </form>

          <aside className="panel p-6 sm:p-8">
            <span className="badge-aqua">Order summary</span>
            <h2 className="mt-4 text-3xl font-bold text-ink">Before you submit</h2>

            <div className="mt-6 space-y-4">
              {cart.items.map((item) => (
                <div className="flex items-start justify-between gap-4 border-b border-line pb-4" key={item.productId}>
                  <div>
                    <p className="font-semibold text-ink">{item.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.quantity} x {formatCurrency(item.price)}
                    </p>
                  </div>
                  <p className="font-semibold text-ink">{formatCurrency(item.lineTotal)}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Total units</span>
                <span className="font-semibold text-ink">{cart.totalItems}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Order total</span>
                <span className="font-semibold text-ink">{formatCurrency(cart.totalAmount)}</span>
              </div>
            </div>
          </aside>
        </section>
      ) : null}
    </div>
  );
}
