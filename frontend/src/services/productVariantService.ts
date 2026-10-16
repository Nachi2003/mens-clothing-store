
import axios from "axios";
import { getAuthToken } from "./authService";
import type { ProductVariant } from "../types/ProductVariant";

const API_URL =
  `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/api/product-variants`;

export interface ProductVariantRequest {
  productId: number;
  size: string;
  color: string;
  price: number;
}

const getAuthHeaders = () => {
  const token = getAuthToken();

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
};

export const getProductVariants = async (): Promise<ProductVariant[]> => {
  const response = await axios.get<ProductVariant[]>(API_URL);
  return response.data;
};

export const createProductVariant = async (
  variant: ProductVariantRequest
): Promise<ProductVariant> => {
  const response = await axios.post<ProductVariant>(
    API_URL,
    variant,
    { headers: getAuthHeaders() }
  );

  return response.data;
};

export const updateProductVariant = async (
  variantId: number,
  variant: ProductVariantRequest
): Promise<ProductVariant> => {
  const response = await axios.put<ProductVariant>(
    `${API_URL}/${variantId}`,
    variant,
    { headers: getAuthHeaders() }
  );

  return response.data;
};

export const deleteProductVariant = async (
  variantId: number
): Promise<void> => {
  await axios.delete(
    `${API_URL}/${variantId}`,
    { headers: getAuthHeaders() }
  );
};
