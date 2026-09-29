import axios from "axios";
import type { Product } from "../types/Product";

const API_URL = "http://localhost:8080/api/products";

export const getProducts = async (): Promise<Product[]> => {
  const response = await axios.get<Product[]>(API_URL);

  return response.data;
};