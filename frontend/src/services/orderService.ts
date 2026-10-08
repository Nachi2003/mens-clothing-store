import { getLoggedInUser } from "./authService";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export interface PlaceOrderRequest {
  phone: string;
  address: string;
}

export async function placeOrder(
  request: PlaceOrderRequest
) {
  const user = getLoggedInUser();

  if (!user) {
    throw new Error("Please log in before placing an order.");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/customers/${user.userId}/orders`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    let message = "Unable to place your order.";

    try {
      const errorData = await response.json();

      if (errorData.message) {
        message = errorData.message;
      }
    } catch {
      // Ignore JSON parsing error
    }

    throw new Error(message);
  }

  return response.json();
}