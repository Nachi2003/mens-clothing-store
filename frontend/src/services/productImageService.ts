
import axios from "axios";
import { getAuthToken } from "./authService";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const API_URL = `${API_BASE_URL}/api/products`;

export interface ProductImage {
  imageId: number;
  imageUrl: string;
  primary: boolean;
  color: string | null;
}

/**
 * Get all images for a product.
 */
export const getProductImages = async (
  productId: number
): Promise<ProductImage[]> => {
  const response = await axios.get<ProductImage[]>(
    `${API_URL}/${productId}/images`
  );

  return response.data;
};

/**
 * Upload an image for a product, optionally associated with a color.
 */
export const uploadProductImage = async (
  productId: number,
  file: File,
  primary: boolean = true,
  color?: string | null
): Promise<ProductImage> => {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Your session has expired. Please log in again.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("primary", String(primary));

  if (color && color.trim()) {
    formData.append("color", color.trim());
  }

  const response = await axios.post<ProductImage>(
    `${API_URL}/${productId}/images`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

/**
 * Delete an image belonging to a product.
 */
export const deleteProductImage = async (
  productId: number,
  imageId: number
): Promise<void> => {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Your session has expired. Please log in again.");
  }

  await axios.delete(`${API_URL}/${productId}/images/${imageId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Build the complete URL used to display an uploaded image.
 */
export const getProductImageUrl = (imageUrl: string): string => {
  if (/^https?:\/\//i.test(imageUrl)) {
    return imageUrl;
  }

  return `${API_BASE_URL.replace(/\/+$/, "")}/${imageUrl.replace(/^\/+/, "")}`;
};
