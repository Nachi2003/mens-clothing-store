const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/users`;

export interface User {
  userId: number;
  name: string;
  email: string;
  phone: string;
  role: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// Register a new customer
export const registerUser = async (
  data: RegisterData
): Promise<User> => {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Registration failed");
  }

  return result;
};

// Login an existing customer
export const loginUser = async (
  data: LoginData
): Promise<User> => {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Login failed");
  }

  // Save logged-in user details
  localStorage.setItem("latelier_user", JSON.stringify(result));

  return result;
};

// Get logged-in user
export const getLoggedInUser = (): User | null => {
  const user = localStorage.getItem("latelier_user");

  return user ? JSON.parse(user) : null;
};

// Logout
export const logoutUser = (): void => {
  localStorage.removeItem("latelier_user");
};