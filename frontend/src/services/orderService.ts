
import { getLoggedInUser } from "./authService";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export interface PlaceOrderRequest {
  phone: string;
  address: string;
  paymentMethod: "COD" | "UPI";
}

export interface PlaceBuyNowOrderRequest {
  variantId: number;
  quantity: number;
  phone: string;
  address: string;
  paymentMethod: "COD" | "UPI";
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("latelier_token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleOrderResponse(response: Response) {
  if (!response.ok) {
    let message = "Unable to place your order.";

    try {
      const errorData = await response.json();

      if (errorData.message) {
        message = errorData.message;
      }
    } catch {
      // Keep the default error message if the response is not JSON.
    }

    throw new Error(message);
  }

  return response.json();
}

/**
 * Normal checkout.
 * Places an order using the customer's backend cart.
 */
export async function placeOrder(request: PlaceOrderRequest) {
  const user = getLoggedInUser();

  if (!user) {
    throw new Error("Please log in before placing an order.");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/customers/${user.userId}/orders`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    }
  );

  return handleOrderResponse(response);
}

/**
 * Buy Now checkout.
 * Places an order for the selected variant and quantity.
 * The backend endpoint must not modify the customer's existing cart.
 */
export async function placeBuyNowOrder(
  request: PlaceBuyNowOrderRequest
) {
  const user = getLoggedInUser();

  if (!user) {
    throw new Error("Please log in before placing your order.");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/customers/${user.userId}/orders/buy-now`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    }
  );

  return handleOrderResponse(response);
}
