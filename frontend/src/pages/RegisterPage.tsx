import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Name: letters and spaces only
    const nameRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
    if (!name.trim()) {
      newErrors.name = "Name is required.";
    } else if (!nameRegex.test(name.trim())) {
      newErrors.name = "Use letters and spaces only.";
    }

    // Email: Gmail address with exactly one @ and one dot
    const emailRegex = /^[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)?@gmail\.com$/;
    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email =
        "Enter a valid Gmail address, e.g. john.doe@gmail.com.";
    }

    // Phone: exactly 10 digits, starting from 6 to 9
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phone) {
      newErrors.phone = "Phone number is required.";
    } else if (!phoneRegex.test(phone)) {
      newErrors.phone =
        "Enter Valid Phone Number.";
    }

    // Password: minimum 8 characters with all required character types
    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 8) {
      newErrors.password = "Password must contain at least 8 characters.";
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password =
        "Include at least one uppercase letter (A-Z).";
    } else if (!/[a-z]/.test(password)) {
      newErrors.password =
        "Include at least one lowercase letter (a-z).";
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = "Include at least one number (0-9).";
    } else if (!/[^A-Za-z0-9]/.test(password)) {
      newErrors.password =
        "Include at least one special character.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await registerUser({
        name: name.trim(),
        email: email.trim(),
        phone,
        password,
      });

      alert("Registration successful! Please log in.");
      navigate("/login");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <Link to="/" style={styles.brand}>
          UNIQUE ZONE
        </Link>

        <h1 style={styles.title}>Create Account</h1>
        <p style={styles.subtitle}>
          Join us and discover your style.
        </p>

        <form onSubmit={handleRegister} style={styles.form} noValidate>
          <label style={styles.label}>Full Name</label>
          <input
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((prev) => ({ ...prev, name: "" }));
            }}
            autoComplete="name"
            required
            style={styles.input}
          />
          {errors.name && <p style={styles.fieldError}>{errors.name}</p>}

          <label style={styles.label}>Email Address</label>
          <input
            type="email"
            placeholder="Enter your Gmail address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((prev) => ({ ...prev, email: "" }));
            }}
            autoComplete="email"
            required
            style={styles.input}
          />
          {errors.email && (
            <p style={styles.fieldError}>{errors.email}</p>
          )}

          <label style={styles.label}>Phone Number</label>
          <input
            type="tel"
            placeholder="10-digit mobile number"
            value={phone}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 10);
              setPhone(value);
              setErrors((prev) => ({ ...prev, phone: "" }));
            }}
            autoComplete="tel-national"
            inputMode="numeric"
            maxLength={10}
            required
            style={styles.input}
          />
          {errors.phone && (
            <p style={styles.fieldError}>{errors.phone}</p>
          )}

          <label style={styles.label}>Password</label>
          <input
            type="password"
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((prev) => ({ ...prev, password: "" }));
            }}
            autoComplete="new-password"
            minLength={8}
            required
            style={styles.input}
          />
          <p style={styles.hint}>
            Minimum 8 characters, including uppercase, lowercase,
            a number, and a special character.
          </p>
          {errors.password && (
            <p style={styles.fieldError}>{errors.password}</p>
          )}

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Creating Account..." : "CREATE ACCOUNT"}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>
            Sign In
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
    marginBottom: "4px",
    width: "100%",
    boxSizing: "border-box",
  },
  hint: {
    fontSize: "12px",
    color: "#777777",
    margin: "0 0 8px",
    lineHeight: 1.5,
  },
  fieldError: {
    color: "#c62828",
    fontSize: "12px",
    margin: "-6px 0 6px",
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