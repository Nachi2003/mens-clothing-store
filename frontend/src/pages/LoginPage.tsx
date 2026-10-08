import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginUser({ email, password });

      alert("Login successful!");
      navigate("/cart");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <Link to="/" style={styles.brand}>
          L’ATELIER
        </Link>

        <h1 style={styles.title}>Welcome Back</h1>
        <p style={styles.subtitle}>Sign in to continue shopping.</p>

        <form onSubmit={handleLogin} style={styles.form}>
          <label style={styles.label}>Email Address</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />

          <label style={styles.label}>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Signing in..." : "SIGN IN"}
          </button>
        </form>

        <p style={styles.footer}>
          Don't have an account?{" "}
          <Link to="/register" style={styles.link}>
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "80vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "24px 16px",
    backgroundColor: "#f8f7f4",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    backgroundColor: "#ffffff",
    padding: "40px 28px",
    boxSizing: "border-box",
  },
  brand: {
    display: "block",
    textAlign: "center",
    fontSize: "25px",
    fontWeight: 700,
    letterSpacing: "4px",
    color: "#222222",
    textDecoration: "none",
    marginBottom: "35px",
  },
  title: {
    textAlign: "center",
    fontSize: "28px",
    color: "#222222",
    marginBottom: "10px",
  },
  subtitle: {
    textAlign: "center",
    color: "#777777",
    marginBottom: "30px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  label: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#333333",
  },
  input: {
    padding: "13px",
    border: "1px solid #dddddd",
    fontSize: "15px",
    outline: "none",
    marginBottom: "10px",
    width: "100%",
    boxSizing: "border-box",
  },
  button: {
    padding: "15px",
    backgroundColor: "#222222",
    color: "#ffffff",
    border: "none",
    fontSize: "14px",
    fontWeight: 600,
    letterSpacing: "1px",
    cursor: "pointer",
    marginTop: "10px",
  },
  error: {
    color: "#c62828",
    fontSize: "14px",
  },
  footer: {
    textAlign: "center",
    marginTop: "25px",
    fontSize: "14px",
    color: "#666666",
  },
  link: {
    color: "#222222",
    fontWeight: 600,
  },
};