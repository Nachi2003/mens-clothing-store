
import { getAuthToken } from "./authService";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export interface InStoreSaleItemRequest {
  variantId: number;
  quantity: number;
  discount: number;
}

export interface InStoreSaleRequest {
  customerName?: string;
  customerPhone?: string;
  paymentMethod: "CASH" | "UPI";
  items: InStoreSaleItemRequest[];
}

export interface InStoreSaleResponse {
  saleId: number;
  saleNumber: string;
  customerName?: string | null;
  customerPhone?: string | null;
  totalAmount: number;
  totalDiscount: number;
  paymentMethod: string;
  createdAt: string;
}

export async function createInStoreSale(
  request: InStoreSaleRequest
): Promise<InStoreSaleResponse> {
  const token = getAuthToken();

  if (!token) {
    throw new Error(
      "Your staff session has expired. Please sign in again."
    );
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/sales`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      message || `Could not complete sale (${response.status}).`
    );
  }

  return response.json() as Promise<InStoreSaleResponse>;
}
