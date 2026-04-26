import { useEffect, useMemo, useState } from "react";

import FormField from "../components/FormField";
import { useAuth } from "../contexts/AuthContext";
import {
  createProduct,
  deleteProduct,
  getAdminOrders,
  getAdminUsers,
  getProducts,
  updateAdminOrderStatus,
  updateProduct,
  updateUserTrust,
} from "../services/api";
import { formatCurrency } from "../utils/formatters";

const orderStatuses = ["Pending", "Confirmed", "Shipped", "Delivered"];

const emptyProductForm = {
  name: "",
  price: "",
  stock: "",
  category: "",
  imageUrl: "",
};

function StatCard({ label, value, tone = "brand", helpText }) {
  const toneClass =
    tone === "aqua"
      ? "bg-aqua/10 text-aqua"
      : tone === "ink"
        ? "bg-ink/10 text-ink"
        : "bg-brand/10 text-brand";

  return (
    <div className="panel-muted p-5">
      <span className={`badge ${toneClass}`}>{label}</span>
      <p className="mt-4 text-3xl font-bold text-ink">{value}</p>
      <p className="mt-2 text-sm leading-7 text-slate-500">{helpText}</p>
    </div>
  );
}

function SectionHeader({ badge, title, copy }) {
  return (
    <div className="space-y-3">
      <span className="badge-brand">{badge}</span>
      <h2 className="text-3xl font-bold text-ink">{title}</h2>
      <p className="max-w-2xl text-sm leading-7 text-slate-600">{copy}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [editingProductId, setEditingProductId] = useState("");
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [orderStatusDrafts, setOrderStatusDrafts] = useState({});

  const trustedUsers = useMemo(
    () => users.filter((account) => account.isTrusted).length,
    [users]
  );

  const pendingOrders = useMemo(
    () => orders.filter((order) => order.status === "Pending").length,
    [orders]
  );

  const totalRevenueSnapshot = useMemo(
    () =>
      orders.reduce((sum, order) => {
        const total = order.products.reduce(
          (innerSum, item) => innerSum + item.quantity * item.price,
          0
        );
        return sum + total;
      }, 0),
    [orders]
  );

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setIsLoading(true);

      try {
        const [usersData, productsData, ordersData] = await Promise.all([
          getAdminUsers(token),
          getProducts(),
          getAdminOrders(token),
        ]);

        if (!active) {
          return;
        }

        setUsers(usersData?.users || []);
        setProducts(productsData?.products || []);
        setOrders(ordersData?.orders || []);
        setOrderStatusDrafts(
          Object.fromEntries(
            (ordersData?.orders || []).map((order) => [order.id, order.status])
          )
        );
      } catch (error) {
        if (active) {
          setMessage({
            type: "error",
            text: error.message || "Unable to load admin dashboard data.",
          });
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [token]);

  function handleProductFormChange(event) {
    const { name, value } = event.target;
    setProductForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function beginEditingProduct(product) {
    setEditingProductId(product._id);
    setProductForm({
      name: product.name,
      price: String(product.price),
      stock: String(product.stock),
      category: product.category,
      imageUrl: product.imageUrl,
    });
    setMessage({ type: "", text: "" });
  }

  function resetProductForm() {
    setEditingProductId("");
    setProductForm(emptyProductForm);
  }

  async function handleProductSubmit(event) {
    event.preventDefault();
    setMessage({ type: "", text: "" });

    const payload = {
      name: productForm.name.trim(),
      price: Number(productForm.price),
      stock: Number(productForm.stock),
      category: productForm.category.trim(),
      imageUrl: productForm.imageUrl.trim(),
    };

    if (
      !payload.name ||
      productForm.price === "" ||
      productForm.stock === "" ||
      !payload.category ||
      !payload.imageUrl
    ) {
      setMessage({
        type: "error",
        text: "Please complete every product field before saving.",
      });
      return;
    }

    setBusyKey("product-submit");

    try {
      if (editingProductId) {
        const data = await updateProduct(token, editingProductId, payload);

        setProducts((current) =>
          current.map((product) =>
            product._id === editingProductId ? data.product : product
          )
        );
        setMessage({ type: "success", text: "Product updated successfully." });
      } else {
        const data = await createProduct(token, payload);
        setProducts((current) => [data.product, ...current]);
        setMessage({ type: "success", text: "Product created successfully." });
      }

      resetProductForm();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Unable to save product right now.",
      });
    } finally {
      setBusyKey("");
    }
  }

  async function handleDeleteProduct(productId) {
    setBusyKey(`delete-${productId}`);
    setMessage({ type: "", text: "" });

    try {
      await deleteProduct(token, productId);
      setProducts((current) => current.filter((product) => product._id !== productId));

      if (editingProductId === productId) {
        resetProductForm();
      }

      setMessage({ type: "success", text: "Product deleted successfully." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Unable to delete product right now.",
      });
    } finally {
      setBusyKey("");
    }
  }

  async function handleTrustToggle(account) {
    const nextValue = !account.isTrusted;
    setBusyKey(`trust-${account.id}`);
    setMessage({ type: "", text: "" });

    try {
      const data = await updateUserTrust(token, account.id, { isTrusted: nextValue });
      setUsers((current) =>
        current.map((item) => (item.id === account.id ? data.user : item))
      );
      setMessage({
        type: "success",
        text: `${account.mobileNumber} marked as ${nextValue ? "trusted" : "not trusted"}.`,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Unable to update trust status right now.",
      });
    } finally {
      setBusyKey("");
    }
  }

  function handleStatusDraftChange(orderId, value) {
    setOrderStatusDrafts((current) => ({
      ...current,
      [orderId]: value,
    }));
  }

  async function handleOrderStatusUpdate(order) {
    const nextStatus = orderStatusDrafts[order.id] || order.status;
    setBusyKey(`status-${order.id}`);
    setMessage({ type: "", text: "" });

    try {
      const data = await updateAdminOrderStatus(token, order.id, {
        status: nextStatus,
      });
      setOrders((current) =>
        current.map((item) => (item.id === order.id ? data.order : item))
      );
      setOrderStatusDrafts((current) => ({
        ...current,
        [order.id]: data.order.status,
      }));
      setMessage({ type: "success", text: "Order status updated successfully." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Unable to update order status right now.",
      });
    } finally {
      setBusyKey("");
    }
  }

  return (
    <div className="space-y-10">
      <section className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <div className="panel p-6 sm:p-8 lg:p-10">
          <span className="badge-brand">Admin dashboard</span>
          <h1 className="section-title mt-4 max-w-3xl text-balance">
            Keep users, products, and order operations in one responsive control room.
          </h1>
          <p className="section-copy mt-5">
            Review user trust status, manage the product catalog, and move orders through delivery
            without leaving a single screen. The layout compresses cleanly across mobile, tablet,
            and desktop.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              helpText="Registered buyers visible to admin"
              label="Users"
              value={users.length}
            />
            <StatCard
              helpText="Approved for pay-after-delivery"
              label="Trusted"
              tone="aqua"
              value={trustedUsers}
            />
            <StatCard
              helpText="Products currently in the storefront"
              label="Products"
              tone="ink"
              value={products.length}
            />
            <StatCard
              helpText="Orders still waiting for admin action"
              label="Pending"
              value={pendingOrders}
            />
          </div>
        </div>

        <aside className="panel flex flex-col gap-6 p-6 sm:p-8">
          <div className="panel-muted p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Signed in as</p>
            <p className="mt-2 text-xl font-bold text-ink">{user?.mobileNumber}</p>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              Admin access is active for this session. Sensitive actions stay behind JWT-protected
              endpoints.
            </p>
          </div>

          <div className="rounded-[26px] bg-ink p-6 text-white">
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">Revenue snapshot</p>
            <p className="mt-3 text-3xl font-bold">{formatCurrency(totalRevenueSnapshot)}</p>
            <p className="mt-3 text-sm leading-7 text-white/75">
              Based on all recorded orders currently returned by the admin orders API.
            </p>
          </div>
        </aside>
      </section>

      {message.text ? (
        <div
          className={[
            "panel px-5 py-4 text-sm font-medium",
            message.type === "error" ? "text-red-600" : "text-aqua",
          ].join(" ")}
        >
          {message.text}
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="panel h-56 animate-pulse p-6" key={index}>
              <div className="h-full rounded-[24px] bg-slate-100" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <section className="space-y-6" id="users">
            <SectionHeader
              badge="Users"
              copy="Switch trusted-buyer access directly from the dashboard. This controls whether a user can choose Pay After Delivery during checkout."
              title="Review and mark trusted buyers"
            />

            <div className="grid gap-4 lg:grid-cols-2">
              {users.length ? (
                users.map((account) => (
                  <article className="panel-muted p-5" key={account.id}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="badge-aqua">
                            {account.isTrusted ? "Trusted" : "Standard"}
                          </span>
                          {account.isAdmin ? <span className="badge-ink">Admin</span> : null}
                        </div>
                        <h3 className="mt-3 text-xl font-bold text-ink">{account.mobileNumber}</h3>
                        <p className="mt-2 text-sm leading-7 text-slate-500">
                          Created {new Date(account.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <button
                        className={account.isTrusted ? "btn-secondary" : "btn-primary"}
                        disabled={busyKey === `trust-${account.id}`}
                        onClick={() => handleTrustToggle(account)}
                        type="button"
                      >
                        {busyKey === `trust-${account.id}`
                          ? "Updating..."
                          : account.isTrusted
                            ? "Mark Not Trusted"
                            : "Mark Trusted"}
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="panel p-8 lg:col-span-2">
                  <h3 className="text-2xl font-bold text-ink">No users found</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    New registrations will appear here for trust management.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-6" id="products">
            <SectionHeader
              badge="Products"
              copy="Create new catalog entries, edit pricing and stock, or remove items that are no longer active."
              title="Manage product inventory"
            />

            <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
              <form className="panel space-y-5 p-6 sm:p-8" onSubmit={handleProductSubmit}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <span className="badge-aqua">
                      {editingProductId ? "Edit product" : "Add product"}
                    </span>
                    <h3 className="mt-3 text-2xl font-bold text-ink">
                      {editingProductId ? "Update selected item" : "Create a new catalog item"}
                    </h3>
                  </div>

                  {editingProductId ? (
                    <button className="btn-ghost" onClick={resetProductForm} type="button">
                      Cancel edit
                    </button>
                  ) : null}
                </div>

                <FormField
                  label="Product Name"
                  name="name"
                  onChange={handleProductFormChange}
                  placeholder="20L Mineral Water Pack"
                  value={productForm.name}
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    label="Price"
                    min="0"
                    name="price"
                    onChange={handleProductFormChange}
                    placeholder="250"
                    step="0.01"
                    type="number"
                    value={productForm.price}
                  />
                  <FormField
                    label="Stock"
                    min="0"
                    name="stock"
                    onChange={handleProductFormChange}
                    placeholder="80"
                    step="1"
                    type="number"
                    value={productForm.stock}
                  />
                </div>
                <FormField
                  label="Category"
                  name="category"
                  onChange={handleProductFormChange}
                  placeholder="Water bottles"
                  value={productForm.category}
                />
                <FormField
                  label="Image URL"
                  name="imageUrl"
                  onChange={handleProductFormChange}
                  placeholder="https://example.com/product.jpg"
                  value={productForm.imageUrl}
                />

                <button className="btn-primary w-full" disabled={busyKey === "product-submit"} type="submit">
                  {busyKey === "product-submit"
                    ? editingProductId
                      ? "Updating product..."
                      : "Creating product..."
                    : editingProductId
                      ? "Update product"
                      : "Add product"}
                </button>
              </form>

              <div className="space-y-4">
                {products.length ? (
                  products.map((product) => (
                    <article className="panel-muted p-5" key={product._id}>
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                        <img
                          alt={product.name}
                          className="h-28 w-full rounded-[22px] object-cover sm:w-32"
                          src={product.imageUrl}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="badge-aqua">{product.category}</span>
                            <span className="badge-ink">{product.stock} in stock</span>
                          </div>
                          <h3 className="mt-3 text-2xl font-bold text-ink">{product.name}</h3>
                          <p className="mt-2 text-sm leading-7 text-slate-500">
                            Unit price: {formatCurrency(product.price)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                        <button
                          className="btn-secondary"
                          onClick={() => beginEditingProduct(product)}
                          type="button"
                        >
                          Edit product
                        </button>
                        <button
                          className="btn-ghost border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50"
                          disabled={busyKey === `delete-${product._id}`}
                          onClick={() => handleDeleteProduct(product._id)}
                          type="button"
                        >
                          {busyKey === `delete-${product._id}` ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="panel p-8">
                    <h3 className="text-2xl font-bold text-ink">No products yet</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-500">
                      Create your first product from the form on the left and it will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-6" id="orders">
            <SectionHeader
              badge="Orders"
              copy="Move orders forward as they are confirmed, shipped, and delivered. Delivered orders will trigger the backend mock notification."
              title="Update order fulfillment status"
            />

            <div className="grid gap-4 xl:grid-cols-2">
              {orders.length ? (
                orders.map((order) => {
                  const orderTotal = order.products.reduce(
                    (sum, item) => sum + item.quantity * item.price,
                    0
                  );

                  return (
                    <article className="panel p-6" key={order.id}>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="badge-brand">{order.status}</span>
                            <span className="badge-ink">{order.paymentType}</span>
                          </div>
                          <h3 className="mt-3 text-xl font-bold text-ink">
                            {order.user?.mobileNumber || "Unknown user"}
                          </h3>
                          <p className="mt-1 text-sm leading-7 text-slate-500">
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="rounded-[20px] bg-surface px-4 py-3 text-right">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                            Order total
                          </p>
                          <p className="mt-1 text-xl font-bold text-ink">
                            {formatCurrency(orderTotal)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 rounded-[24px] bg-surface/80 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                          Delivery address
                        </p>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{order.address}</p>
                      </div>

                      <div className="mt-5 space-y-3">
                        {order.products.map((item, index) => (
                          <div
                            className="flex items-start justify-between gap-3 border-b border-line pb-3 text-sm"
                            key={`${order.id}-${item.name}-${index}`}
                          >
                            <div>
                              <p className="font-semibold text-ink">{item.name}</p>
                              <p className="mt-1 text-slate-500">
                                {item.quantity} x {formatCurrency(item.price)}
                              </p>
                            </div>
                            <p className="font-semibold text-ink">
                              {formatCurrency(item.quantity * item.price)}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <select
                          className="field"
                          onChange={(event) =>
                            handleStatusDraftChange(order.id, event.target.value)
                          }
                          value={orderStatusDrafts[order.id] || order.status}
                        >
                          {orderStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <button
                          className="btn-primary sm:min-w-40"
                          disabled={busyKey === `status-${order.id}`}
                          onClick={() => handleOrderStatusUpdate(order)}
                          type="button"
                        >
                          {busyKey === `status-${order.id}` ? "Saving..." : "Update status"}
                        </button>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="panel p-8 xl:col-span-2">
                  <h3 className="text-2xl font-bold text-ink">No orders yet</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    Incoming orders will appear here for status management.
                  </p>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
