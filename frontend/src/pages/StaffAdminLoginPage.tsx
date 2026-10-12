import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginStaffAdmin } from "../services/authService";

export default function StaffAdminLoginPage() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "STAFF">("STAFF");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    console.log("Login attempt:", {
       userId: userId.trim(),
       role,
    });

    try {
      const user = await loginStaffAdmin({
        userId: userId.trim(),
        password,
        role,
      });

      if (user.role === "ADMIN") {
        navigate("/staff-admin/admin");
      } else if (user.role === "STAFF") {
        navigate("/staff-admin/staff");
      } else {
        setError("Access denied. Staff/Admin access only.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="staff-admin-login-page">
      <section className="staff-admin-login-card">
        <Link to="/" className="staff-admin-login-brand">
          UNIQUE ZONE
        </Link>

        <p className="staff-admin-login-tagline">
          THE FASHION GARAGE
        </p>

        <h1 className="staff-admin-login-title">Staff & Admin</h1>

        <p className="staff-admin-login-subtitle">
          Sign in to access the store portal.
        </p>

        <form onSubmit={handleLogin} className="staff-admin-login-form">
          <label htmlFor="userId">User ID</label>
          <input
            id="userId"
            type="text"
            inputMode="numeric"
            placeholder="Enter your User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            autoComplete="username"
            required
          />

          <label htmlFor="staffPassword">Password</label>
          <input
            id="staffPassword"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          <label htmlFor="staffRole">Login As</label>
          <select
            id="staffRole"
            value={role}
            onChange={(e) =>
              setRole(e.target.value as "ADMIN" | "STAFF")
            }
          >
            <option value="STAFF">Staff</option>
            <option value="ADMIN">Admin</option>
          </select>

          {error && (
            <p className="staff-admin-login-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "SIGNING IN..." : "SIGN IN"}
          </button>
        </form>

        <Link to="/login" className="staff-admin-login-back">
          Return to customer login
        </Link>
      </section>
    </main>
  );
}