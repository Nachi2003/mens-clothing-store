import { getLoggedInUser } from "./authService";

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/customers`;

export interface BackendCartItem {
  cartItemId: number;
  variantId: number;
  productName: string;
  size: string;
  color: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface BackendCart {
  cartId: number;
  customerId: number;
  items: BackendCartItem[];
  totalAmount: number;
}

// Get logged-in customer's ID
const getUserId = (): number => {
  const user = getLoggedInUser();

  if (!user) {
    throw new Error("Please log in to continue.");
  }

  return user.userId;
};

// Add item to backend cart
export const addToBackendCart = async (
  variantId: number,
  quantity: number
): Promise<void> => {
  const userId = getUserId();

  const response = await fetch(
    `${API_URL}/${userId}/cart/items`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        variantId,
        quantity,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to add item to cart.");
  }
};

// Get backend cart
export const getBackendCart = async (): Promise<BackendCart> => {
  const userId = getUserId();

  const response = await fetch(
    `${API_URL}/${userId}/cart/items`
  );

  if (!response.ok) {
    const message = await response.text();

    console.error("Cart API error:", response.status, message);

    throw new Error(
      `Failed to load cart (${response.status}). ${message}`
    );
  }

  return response.json();
};
// Update backend cart quantity
export const updateBackendCartQuantity = async (
  cartItemId: number,
  quantity: number
): Promise<void> => {
  const userId = getUserId();

  const response = await fetch(
    `${API_URL}/${userId}/cart/items/${cartItemId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quantity }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update cart quantity.");
  }
};

// Remove item from backend cart
export const removeFromBackendCart = async (
  cartItemId: number
): Promise<void> => {
  const userId = getUserId();

  const response = await fetch(
    `${API_URL}/${userId}/cart/items/${cartItemId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to remove item from cart.");
  }
};