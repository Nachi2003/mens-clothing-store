import { getLoggedInUser, getAuthToken } from "./authService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export interface CustomerAddress {
  addressId?: number;
  userId?: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getCustomerAddress(): Promise<CustomerAddress | null> {
  const user = getLoggedInUser();
  if (!user) throw new Error("Please log in.");
  const response = await fetch(`${API_BASE_URL}/api/customers/${user.userId}/address`, {
    headers: authHeaders(),
  });
  if (response.status === 404) return null;
  if (!response.ok) return null;
  return response.json();
}

export async function saveCustomerAddress(address: CustomerAddress): Promise<CustomerAddress> {
  const user = getLoggedInUser();
  if (!user) throw new Error("Please log in.");
  const url = `${API_BASE_URL}/api/customers/${user.userId}/address`;
  const headers = authHeaders();
  const existing = await getCustomerAddress();
  const response = await fetch(url, {
    method: existing ? "PUT" : "POST",
    headers,
    body: JSON.stringify(address),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || "Unable to save address.");
  }
  return response.json();
}
