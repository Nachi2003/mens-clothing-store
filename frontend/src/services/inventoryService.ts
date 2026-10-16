
import { getAuthToken } from "./authService";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export interface Inventory {
  inventoryId: number;
  variantId: number;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  updatedAt: string;
}

export interface InventoryRequest {
  variantId: number;
  quantity: number;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();

  const response = await fetch(
    `${API_BASE_URL}/api/inventory${endpoint}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const getInventory = () =>
  apiRequest<Inventory[]>("");

export const getInventoryByVariantId = (variantId: number) =>
  apiRequest<Inventory>(`/variant/${variantId}`);

export const createInventory = (request: InventoryRequest) =>
  apiRequest<Inventory>("", {
    method: "POST",
    body: JSON.stringify(request),
  });

export const updateInventory = (
  variantId: number,
  request: InventoryRequest
) =>
  apiRequest<Inventory>(`/variant/${variantId}`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
