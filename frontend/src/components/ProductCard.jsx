import { useState } from "react";

import { clamp, formatCurrency } from "../utils/formatters";

export default function ProductCard({ product, onAddToCart, isBusy = false }) {
  const [quantity, setQuantity] = useState(1);
  const [imageFailed, setImageFailed] = useState(false);

  const stockLabel =
    product.stock > 24
      ? { label: "Ready to ship", className: "badge-aqua" }
      : product.stock > 0
        ? { label: `Only ${product.stock} left`, className: "badge-brand" }
        : { label: "Sold out", className: "badge-ink" };

  function handleQuantityChange(event) {
    const nextValue = Number(event.target.value || 1);
    const safeQuantity = clamp(nextValue || 1, 1, Math.max(product.stock, 1));
    setQuantity(safeQuantity);
  }

  return (
    <article className="panel flex h-full flex-col overflow-hidden animate-rise">
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-brand/10 via-white to-aqua/10 p-4">
        <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-brand/10 blur-2xl" />
        <div className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-aqua/10 blur-2xl" />
        {imageFailed ? (
          <div className="flex h-56 items-center justify-center rounded-[22px] bg-white/90 text-5xl font-heading font-bold text-brand">
            {product.name.slice(0, 1)}
          </div>
        ) : (
          <img
            alt={product.name}
            className="h-56 w-full rounded-[22px] object-cover shadow-lg shadow-ink/10"
            onError={() => setImageFailed(true)}
            src={product.imageUrl}
          />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-5 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <span className="badge-aqua">{product.category}</span>
            <h3 className="text-2xl font-bold text-ink">{product.name}</h3>
          </div>
          <span className={stockLabel.className}>{stockLabel.label}</span>
        </div>

        <p className="text-sm leading-6 text-slate-500">
          Wholesale-friendly pricing with live stock visibility for your next bulk order.
        </p>

        <div className="mt-auto space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Unit price
              </p>
              <p className="text-2xl font-bold text-ink">{formatCurrency(product.price)}</p>
            </div>
            <label className="grid gap-2 text-sm font-semibold text-ink/90">
              Quantity
              <input
                className="field w-24 text-center"
                disabled={product.stock === 0}
                max={Math.max(product.stock, 1)}
                min="1"
                onChange={handleQuantityChange}
                type="number"
                value={quantity}
              />
            </label>
          </div>

          <button
            className="btn-primary w-full"
            disabled={product.stock === 0 || isBusy}
            onClick={() => onAddToCart(product, quantity)}
            type="button"
          >
            {isBusy ? "Adding..." : product.stock === 0 ? "Out of stock" : "Add to cart"}
          </button>
        </div>
      </div>
    </article>
  );
}
