const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://wholesale-backend-4z9t.onrender.com";

async function request(path, options = {}) {
  const { method = "GET", body, token, signal } = options;

  const headers = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed with status ${response.status}`);
  }

  return payload;
}

export function loginUser(credentials) {
  return request("/login", {
    method: "POST",
    body: credentials,
  });
}

export function registerUser(payload) {
  return request("/register", {
    method: "POST",
    body: payload,
  });
}

export function verifyRegistration(payload) {
  return request("/verify-register", {
    method: "POST",
    body: payload,
  });
}

export function forgotPassword(payload) {
  return request("/forgot-password", {
    method: "POST",
    body: payload,
  });
}

export function resetPassword(payload) {
  return request("/reset-password", {
    method: "POST",
    body: payload,
  });
}

export function getProducts() {
  return request("/products");
}

export function createProduct(token, payload) {
  return request("/products", {
    method: "POST",
    token,
    body: payload,
  });
}

export function updateProduct(token, productId, payload) {
  return request(`/products/${productId}`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export function deleteProduct(token, productId) {
  return request(`/products/${productId}`, {
    method: "DELETE",
    token,
  });
}

export function getCart(token) {
  return request("/cart", { token });
}

export function addToCart(token, payload) {
  return request("/cart", {
    method: "POST",
    token,
    body: payload,
  });
}

export function updateCartItem(token, productId, payload) {
  return request(`/cart/${productId}`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export function removeCartItem(token, productId) {
  return request(`/cart/${productId}`, {
    method: "DELETE",
    token,
  });
}

export function placeOrder(token, payload) {
  return request("/orders", {
    method: "POST",
    token,
    body: payload,
  });
}

export function getAdminUsers(token) {
  return request("/admin/users", { token });
}

export function updateUserTrust(token, userId, payload) {
  return request(`/admin/user/${userId}/trust`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export function getAdminOrders(token) {
  return request("/admin/orders", { token });
}

export function updateAdminOrderStatus(token, orderId, payload) {
  return request(`/admin/order/${orderId}/status`, {
    method: "PUT",
    token,
    body: payload,
  });
}
