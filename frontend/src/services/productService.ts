import axios from "axios";
import { getAuthToken } from "./authService";
import type { Product } from "../types/Product";

const API_URL =
  `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/api/products`;

export interface ProductRequest {
  categoryId: number;
  productName: string;
  description: string;
}

const getAuthHeaders = () => {
  const token = getAuthToken();

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
};

export const getProducts = async (): Promise<Product[]> => {
  const response = await axios.get<Product[]>(API_URL);
  return response.data;
};

export const createProduct = async (
  product: ProductRequest
): Promise<Product> => {
  const response = await axios.post<Product>(
    API_URL,
    product,
    { headers: getAuthHeaders() }
  );

  return response.data;
};

export const updateProduct = async (
  productId: number,
  product: ProductRequest
): Promise<Product> => {
  const response = await axios.put<Product>(
    `${API_URL}/${productId}`,
    product,
    { headers: getAuthHeaders() }
  );

  return response.data;
};

export const deleteProduct = async (
  productId: number
): Promise<void> => {
  await axios.delete(
    `${API_URL}/${productId}`,
    { headers: getAuthHeaders() }
  );
};