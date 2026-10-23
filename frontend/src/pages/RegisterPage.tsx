
import { useState } from "react";
import type { FormEvent, CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  registerUser,
  verifyRegistrationOtp,
} from "../services/authService";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<"details" | "otp">("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(trimmedName)) {
      setError("Enter a valid name using letters and spaces.");
      return;
    }

    if (
      !/^[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*@gmail\.com$/i.test(
        trimmedEmail
      )
    ) {
      setError("Enter a valid Gmail address.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      setError(
        "Password needs 8+ characters, uppercase, lowercase, a number, and a special character."
      );
      return;
    }

    setLoading(true);

    try {
      const result = await registerUser({
        name: trimmedName,
        email: trimmedEmail,
        phone,
        password,
      });

      setChallengeId(result.challengeId);
      setStep("otp");
      setMessage(
        "OTP sent to your email address. It expires in 5 minutes."
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not send OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!challengeId) {
      setError("Your verification session is missing. Please try again.");
      setStep("details");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the valid 6-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      await verifyRegistrationOtp({ challengeId, otp });

      navigate("/login", {
        replace: true,
        state: {
          registrationSuccess: true,
          email: email.trim(),
        },
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "OTP verification failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep("details");
    setOtp("");
    setError("");
    setMessage("");
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <Link to="/" style={styles.brand}>
          UNIQUE ZONE
        </Link>

        <h1 style={styles.title}>
          {step === "details" ? "Create Account" : "Verify Your Email"}
        </h1>

        <p style={styles.subtitle}>
          {step === "details"
            ? "Join us and discover your style."
            : `Enter the 6-digit OTP sent to ${email}.`}
        </p>

        {step === "details" ? (
          <form onSubmit={handleRequestOtp} style={styles.form}>
            <label htmlFor="register-name" style={styles.label}>
              Full Name
            </label>
            <input
              id="register-name"
              style={styles.input}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
              maxLength={100}
              placeholder="Enter your full name"
            />

            <label htmlFor="register-email" style={styles.label}>
              Email Address
            </label>
            <input
              id="register-email"
              style={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              maxLength={150}
              placeholder="Enter your Gmail address"
            />

            <label htmlFor="register-phone" style={styles.label}>
              Phone Number
            </label>
            <div style={styles.phoneField}>
              <span style={styles.countryCode}>+91</span>
              <input
                id="register-phone"
                style={styles.phoneInput}
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                autoComplete="tel-national"
                maxLength={10}
                minLength={10}
                required
                placeholder="10-digit mobile number"
              />
            </div>

            <label htmlFor="register-password" style={styles.label}>
              Password
            </label>
            <input
              id="register-password"
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              placeholder="Create a strong password"
            />

            <p style={styles.hint}>
              Use at least 8 characters, including uppercase and lowercase
              letters, a number, and a special character.
            </p>

            {error && (
              <p style={styles.error} role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              style={{
                ...styles.button,
                ...(loading ? styles.buttonDisabled : {}),
              }}
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "SEND OTP & CONTINUE"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} style={styles.form}>
            <label htmlFor="register-otp" style={styles.label}>
              Email Verification Code
            </label>

            <input
              id="register-otp"
              style={styles.otpInput}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              maxLength={6}
              minLength={6}
              required
              autoFocus
              placeholder="000000"
              aria-describedby="otp-message"
            />

            {message && (
              <p id="otp-message" style={styles.message} role="status">
                {message}
              </p>
            )}

            {error && (
              <p style={styles.error} role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              style={{
                ...styles.button,
                ...(loading || otp.length !== 6
                  ? styles.buttonDisabled
                  : {}),
              }}
              disabled={loading || otp.length !== 6}
            >
              {loading ? "Verifying..." : "VERIFY EMAIL & CREATE ACCOUNT"}
            </button>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={handleBack}
              disabled={loading}
            >
              Back to details
            </button>
          </form>
        )}

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

const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: "80vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "24px 16px",
    backgroundColor: "#f8f7f4",
    boxSizing: "border-box",
  },
  card: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#fff",
    padding: "36px 28px",
    boxSizing: "border-box",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.06)",
  },
  brand: {
    display: "block",
    textAlign: "center",
    fontSize: 25,
    fontWeight: 700,
    letterSpacing: 4,
    color: "#222",
    textDecoration: "none",
    marginBottom: 28,
  },
  title: {
    textAlign: "center",
    fontSize: 28,
    color: "#222",
    marginBottom: 10,
  },
  subtitle: {
    textAlign: "center",
    color: "#777",
    marginBottom: 26,
    lineHeight: 1.5,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: 600,
    color: "#333",
  },
  input: {
    padding: 13,
    border: "1px solid #ddd",
    fontSize: 15,
    width: "100%",
    boxSizing: "border-box",
    borderRadius: 2,
  },
  phoneField: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #ddd",
    width: "100%",
    boxSizing: "border-box",
  },
  countryCode: {
    padding: "13px 12px",
    borderRight: "1px solid #ddd",
    color: "#444",
    fontSize: 15,
    whiteSpace: "nowrap",
  },
  phoneInput: {
    padding: 13,
    border: 0,
    outline: "none",
    fontSize: 15,
    flex: 1,
    minWidth: 0,
    boxSizing: "border-box",
  },
  hint: {
    fontSize: 12,
    color: "#777",
    lineHeight: 1.5,
    margin: "0 0 8px",
  },
  error: {
    color: "#c62828",
    fontSize: 13,
    margin: "4px 0",
    lineHeight: 1.5,
  },
  message: {
    color: "#276749",
    fontSize: 13,
    margin: "4px 0",
    lineHeight: 1.5,
  },
  button: {
    padding: 15,
    backgroundColor: "#222",
    color: "#fff",
    border: 0,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 1,
    cursor: "pointer",
    marginTop: 8,
    width: "100%",
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  secondaryButton: {
    padding: 12,
    background: "#fff",
    border: "1px solid #ddd",
    cursor: "pointer",
    width: "100%",
  },
  otpInput: {
    padding: 15,
    border: "1px solid #ddd",
    fontSize: 24,
    letterSpacing: 8,
    textAlign: "center",
    width: "100%",
    boxSizing: "border-box",
    borderRadius: 2,
  },
  footer: {
    textAlign: "center",
    marginTop: 24,
    fontSize: 14,
    color: "#666",
  },
  link: {
    color: "#222",
    fontWeight: 600,
  },
};
