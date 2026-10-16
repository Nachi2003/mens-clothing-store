import { getAuthToken } from "./authService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface Category {
  categoryId: number;
  categoryName: string;
  description: string | null;
}

export interface CategoryRequest {
  categoryName: string;
  description: string;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE_URL}/api/categories${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const getCategories = () =>
  apiRequest<Category[]>("");

export const createCategory = (category: CategoryRequest) =>
  apiRequest<Category>("", {
    method: "POST",
    body: JSON.stringify(category),
  });

export const updateCategory = (
  categoryId: number,
  category: CategoryRequest
) =>
  apiRequest<Category>(`/${categoryId}`, {
    method: "PUT",
    body: JSON.stringify(category),
  });

export const deleteCategory = (categoryId: number) =>
  apiRequest<void>(`/${categoryId}`, {
    method: "DELETE",
  });