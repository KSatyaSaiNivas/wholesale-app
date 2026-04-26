import { useState } from "react";
import { Link } from "react-router-dom";

import { useCart } from "../contexts/CartContext";
import { formatCurrency } from "../utils/formatters";

export default function CartPage() {
  const { cart, isLoading, removeItemFromCart, updateItemQuantity } = useCart();
  const [busyItemId, setBusyItemId] = useState("");
  const [error, setError] = useState("");

  async function handleQuantityChange(item, nextQuantity) {
    setError("");
    setBusyItemId(item.productId);

    try {
      await updateItemQuantity(item.productId, nextQuantity);
    } catch (updateError) {
      setError(updateError.message || "Unable to update cart item.");
    } finally {
      setBusyItemId("");
    }
  }

  async function handleRemove(productId) {
    setError("");
    setBusyItemId(productId);

    try {
      await removeItemFromCart(productId);
    } catch (removeError) {
      setError(removeError.message || "Unable to remove item.");
    } finally {
      setBusyItemId("");
    }
  }

  return (
    <div className="space-y-8">
      <section className="panel grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
        <div>
          <span className="badge-brand">Cart management</span>
          <h1 className="mt-4 text-4xl font-bold text-ink">Review today&apos;s restock list.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            Adjust quantities, remove slow movers, and keep the order tight before checkout.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="panel-muted p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Line items</p>
            <p className="mt-2 text-3xl font-bold text-ink">{cart.items.length}</p>
          </div>
          <div className="panel-muted p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Units total</p>
            <p className="mt-2 text-3xl font-bold text-ink">{cart.totalItems}</p>
          </div>
          <div className="panel-muted p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Order value</p>
            <p className="mt-2 text-2xl font-bold text-ink">{formatCurrency(cart.totalAmount)}</p>
          </div>
        </div>
      </section>

      {error ? (
        <div className="panel px-5 py-4 text-sm font-medium text-red-600">{error}</div>
      ) : null}

      {isLoading && !cart.items.length ? (
        <div className="panel p-8 text-center sm:p-10">
          <h2 className="text-3xl font-bold text-ink">Loading your cart</h2>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Pulling the latest quantities and totals from your account.
          </p>
        </div>
      ) : null}

      {!cart.items.length && !isLoading ? (
        <div className="panel p-8 text-center sm:p-10">
          <h2 className="text-3xl font-bold text-ink">Your cart is empty</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
            Add a few products from the catalog and come back here to fine-tune quantities.
          </p>
          <Link className="btn-primary mt-6" to="/">
            Browse products
          </Link>
        </div>
      ) : !isLoading ? (
        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            {cart.items.map((item) => (
              <article
                className="panel-muted flex flex-col gap-5 p-5 sm:p-6 md:grid md:grid-cols-[120px_1fr_auto] md:items-center"
                key={item.productId}
              >
                <img
                  alt={item.name}
                  className="h-28 w-full rounded-[22px] object-cover md:w-[120px]"
                  src={item.imageUrl}
                />

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="badge-aqua">{item.category}</span>
                    <span className="badge-ink">{item.stock} in stock</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-ink">{item.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Unit price: {formatCurrency(item.price)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-4 md:items-end">
                  <div className="flex items-center gap-3">
                    <button
                      className="btn-ghost h-10 w-10 rounded-full p-0"
                      disabled={busyItemId === item.productId || item.quantity <= 1}
                      onClick={() => handleQuantityChange(item, item.quantity - 1)}
                      type="button"
                    >
                      -
                    </button>
                    <div className="min-w-12 text-center">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Qty</p>
                      <p className="text-lg font-bold text-ink">{item.quantity}</p>
                    </div>
                    <button
                      className="btn-ghost h-10 w-10 rounded-full p-0"
                      disabled={busyItemId === item.productId || item.quantity >= item.stock}
                      onClick={() => handleQuantityChange(item, item.quantity + 1)}
                      type="button"
                    >
                      +
                    </button>
                  </div>

                  <p className="text-xl font-bold text-ink">{formatCurrency(item.lineTotal)}</p>

                  <button
                    className="text-sm font-semibold text-red-600"
                    disabled={busyItemId === item.productId}
                    onClick={() => handleRemove(item.productId)}
                    type="button"
                  >
                    {busyItemId === item.productId ? "Updating..." : "Remove item"}
                  </button>
                </div>
              </article>
            ))}
          </div>

          <aside className="panel p-6 sm:p-8">
            <span className="badge-brand">Order summary</span>
            <h2 className="mt-4 text-3xl font-bold text-ink">Ready for checkout</h2>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Total units</span>
                <span className="font-semibold text-ink">{cart.totalItems}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-ink">{formatCurrency(cart.totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Payment</span>
                <span className="font-semibold text-ink">Selected at checkout</span>
              </div>
              <div className="border-t border-line pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-ink">Estimated total</span>
                  <span className="text-2xl font-bold text-ink">
                    {formatCurrency(cart.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            <Link className="btn-primary mt-8 w-full" to="/checkout">
              Proceed to checkout
            </Link>

            <Link className="btn-secondary mt-3 w-full" to="/">
              Continue shopping
            </Link>
          </aside>
        </section>
      ) : null}
    </div>
  );
}
