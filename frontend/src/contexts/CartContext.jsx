import { createContext, useContext, useEffect, useState } from "react";

import {
  addToCart as addToCartRequest,
  getCart as getCartRequest,
  placeOrder as placeOrderRequest,
  removeCartItem as removeCartItemRequest,
  updateCartItem as updateCartItemRequest,
} from "../services/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

const emptyCart = {
  userId: null,
  items: [],
  totalItems: 0,
  totalAmount: 0,
};

export function CartProvider({ children }) {
  const { token } = useAuth();
  const [cart, setCart] = useState(emptyCart);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function syncCart() {
      if (!token) {
        setCart(emptyCart);
        return;
      }

      setIsLoading(true);

      try {
        const data = await getCartRequest(token);

        if (active) {
          setCart(data?.cart || emptyCart);
        }
      } catch (error) {
        if (active) {
          setCart(emptyCart);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    syncCart();

    return () => {
      active = false;
    };
  }, [token]);

  async function refreshCart() {
    if (!token) {
      setCart(emptyCart);
      return emptyCart;
    }

    const data = await getCartRequest(token);
    setCart(data?.cart || emptyCart);
    return data?.cart || emptyCart;
  }

  async function addItemToCart(productId, quantity = 1) {
    if (!token) {
      throw new Error("Please log in to add products to your cart.");
    }

    setIsLoading(true);

    try {
      const data = await addToCartRequest(token, { productId, quantity });
      setCart(data?.cart || emptyCart);
      return data;
    } finally {
      setIsLoading(false);
    }
  }

  async function updateItemQuantity(productId, quantity) {
    if (!token) {
      throw new Error("Please log in to update your cart.");
    }

    setIsLoading(true);

    try {
      const data = await updateCartItemRequest(token, productId, { quantity });
      setCart(data?.cart || emptyCart);
      return data;
    } finally {
      setIsLoading(false);
    }
  }

  async function removeItemFromCart(productId) {
    if (!token) {
      throw new Error("Please log in to update your cart.");
    }

    setIsLoading(true);

    try {
      const data = await removeCartItemRequest(token, productId);
      setCart(data?.cart || emptyCart);
      return data;
    } finally {
      setIsLoading(false);
    }
  }

  async function placeOrder(payload) {
    if (!token) {
      throw new Error("Please log in to place an order.");
    }

    setIsLoading(true);

    try {
      const data = await placeOrderRequest(token, payload);
      setCart(emptyCart);
      return data;
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        addItemToCart,
        updateItemQuantity,
        removeItemFromCart,
        refreshCart,
        placeOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
}
