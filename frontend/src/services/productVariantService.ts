import axios from "axios";
import type { ProductVariant } from "../types/ProductVariant";

const API_URL = "http://localhost:8080/api/product-variants";

export const getProductVariants = async (): Promise<ProductVariant[]> => {
  const response = await axios.get<ProductVariant[]>(API_URL);

  return response.data;
};