const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/users`;

export interface User {
  userId: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  token?: string;
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

export interface StaffAdminLoginData {
  userId: string;
  password: string;
  role: "ADMIN" | "STAFF";
}

// Registration starts by requesting an email OTP. The account is created only after verification.
export interface OtpStartResponse { challengeId: string; message: string; }
export interface OtpVerifyData { challengeId: string; otp: string; }

async function authRequest<T>(path: string, data: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || "Request failed. Please try again.");
  return result as T;
}

export const registerUser = (data: RegisterData): Promise<OtpStartResponse> =>
  authRequest<OtpStartResponse>("/register/request-otp", data);

export const verifyRegistrationOtp = (data: OtpVerifyData): Promise<{message: string}> =>
  authRequest("/register/verify-otp", data);

export const requestPasswordOtp = (email: string): Promise<OtpStartResponse> =>
  authRequest("/forgot-password/request-otp", { email });

export const verifyPasswordOtp = (data: OtpVerifyData): Promise<{resetToken: string; message: string}> =>
  authRequest("/forgot-password/verify-otp", data);

export const resetPassword = (resetToken: string, newPassword: string): Promise<{message: string}> =>
  authRequest("/forgot-password/reset", { resetToken, newPassword });

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

  const result: User & { message?: string } = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Login failed");
  }

  if (!result.token) {
    throw new Error("Login succeeded but no authentication token was returned");
  }

  localStorage.setItem("latelier_user", JSON.stringify(result));
  localStorage.setItem("latelier_token", result.token);

  return result;
};

// Get logged-in user

export const getLoggedInUser = (): User | null => {
  const user = localStorage.getItem("latelier_user");

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user) as User;
  } catch {
    localStorage.removeItem("latelier_user");
    localStorage.removeItem("latelier_token");
    return null;
  }
};


// Get saved authentication token
export const getAuthToken = (): string | null => {
  return localStorage.getItem("latelier_token");
};

// Logout
export const logoutUser = (): void => {
  localStorage.removeItem("latelier_user");
  localStorage.removeItem("latelier_token");
};

// Login Staff or Admin
export const loginStaffAdmin = async (
  data: StaffAdminLoginData
): Promise<User> => {
  const response = await fetch(`${API_URL}/staff-admin/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result: User = await response.json();

  if (!response.ok) {
    throw new Error(
      (result as User & { message?: string }).message ||
        "Staff/Admin login failed"
    );
  }

  if (!result.token) {
    throw new Error("Login succeeded but no authentication token was returned");
  }

  localStorage.setItem("latelier_user", JSON.stringify(result));
  localStorage.setItem("latelier_token", result.token);

  return result;
};