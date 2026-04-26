import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import ProductCard from "../components/ProductCard";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { getProducts } from "../services/api";

const supplyNotes = [
  "Live stock status across every product card",
  "Cart-first browsing tuned for quick repeat orders",
  "Trusted buyers unlock pay-after-delivery at checkout",
];

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addItemToCart, cart } = useCart();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyProductId, setBusyProductId] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        const data = await getProducts();

        if (active) {
          setProducts(data?.products || []);
        }
      } catch (error) {
        if (active) {
          setFeedback({
            type: "error",
            message: error.message || "Unable to load products right now.",
          });
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  async function handleAddToCart(product, quantity) {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/" } });
      return;
    }

    setBusyProductId(product._id);
    setFeedback({ type: "", message: "" });

    try {
      await addItemToCart(product._id, quantity);
      setFeedback({
        type: "success",
        message: `${quantity} x ${product.name} added to your cart.`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "Unable to add this product right now.",
      });
    } finally {
      setBusyProductId("");
    }
  }

  const categoryCount = new Set(products.map((product) => product.category)).size;

  return (
    <div className="space-y-10">
      <section className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <div className="panel p-6 sm:p-8 lg:p-10">
          <span className="badge-brand">Responsive wholesale storefront</span>
          <h1 className="section-title mt-4 max-w-3xl text-balance">
            Bulk-buy essentials without chasing prices across five supplier chats.
          </h1>
          <p className="section-copy mt-5">
            Browse live products, keep the cart current, and check out from phone, tablet, or
            desktop with a flow built around fast-moving store inventory.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a className="btn-primary" href="#catalog">
              Browse catalog
            </a>
            <Link className="btn-secondary" to="/cart">
              Open cart
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="panel-muted p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Products live</p>
              <p className="mt-2 text-3xl font-bold text-ink">{products.length}</p>
            </div>
            <div className="panel-muted p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Categories</p>
              <p className="mt-2 text-3xl font-bold text-ink">{categoryCount}</p>
            </div>
            <div className="panel-muted p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Cart items</p>
              <p className="mt-2 text-3xl font-bold text-ink">{cart.totalItems}</p>
            </div>
          </div>
        </div>

        <aside className="panel flex flex-col justify-between gap-6 overflow-hidden p-6 sm:p-8">
          <div>
            <span className="badge-aqua">Operations board</span>
            <h2 className="mt-4 text-3xl font-bold text-ink">Designed for fast restocking.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              The interface keeps important signals close: stock, payment eligibility, cart
              movement, and streamlined product browsing.
            </p>
          </div>

          <div className="grid gap-3">
            {supplyNotes.map((note) => (
              <div className="panel-muted flex items-center gap-3 px-4 py-4" key={note}>
                <div className="h-3 w-3 rounded-full bg-brand" />
                <p className="text-sm font-medium text-ink">{note}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[26px] bg-ink p-6 text-white">
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">Checkout rule</p>
            <p className="mt-3 text-lg font-semibold">
              {user?.isTrusted
                ? "Your account can choose Pay Now or Pay After Delivery."
                : "Pay Now is enabled by default. Trusted buyers unlock Pay After Delivery."}
            </p>
          </div>
        </aside>
      </section>

      {feedback.message ? (
        <div
          className={[
            "panel px-5 py-4 text-sm font-medium",
            feedback.type === "error" ? "text-red-600" : "text-aqua",
          ].join(" ")}
        >
          {feedback.message}
        </div>
      ) : null}

      <section className="space-y-5" id="catalog">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="badge-ink">Product catalog</span>
            <h2 className="mt-3 text-3xl font-bold text-ink">Best sellers for daily turnover</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-600">
            Every card is tuned for quick purchase decisions, whether you are ordering from a shop
            counter, a tablet in the storeroom, or your desktop.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="panel h-[430px] animate-pulse p-5" key={index}>
                <div className="h-full rounded-[24px] bg-slate-100" />
              </div>
            ))}
          </div>
        ) : products.length ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                isBusy={busyProductId === product._id}
                key={product._id}
                onAddToCart={handleAddToCart}
                product={product}
              />
            ))}
          </div>
        ) : (
          <div className="panel p-8 text-center">
            <h3 className="text-2xl font-bold text-ink">No products available yet</h3>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Add products from the admin backend and they will appear here automatically.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
