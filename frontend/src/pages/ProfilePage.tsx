import { useNavigate, Link } from "react-router-dom";
import { getLoggedInUser, logoutUser } from "../services/authService";

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = getLoggedInUser();

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1>My Profile</h1>
          <p>Please log in to view your profile.</p>
          <button
            style={styles.button}
            onClick={() => navigate("/login")}
          >
            LOGIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <Link to="/" style={styles.brand}>
          UNIQUE ZONE
        </Link>

        <h1 style={styles.title}>My Profile</h1>
        <p style={styles.subtitle}>
          Welcome back, {user.name}!
        </p>

        <div style={styles.details}>
          <div style={styles.row}>
            <span style={styles.label}>Full Name</span>
            <span>{user.name}</span>
          </div>

          <div style={styles.row}>
            <span style={styles.label}>Email Address</span>
            <span style={styles.value}>{user.email}</span>
          </div>

          <div style={styles.row}>
            <span style={styles.label}>Phone Number</span>
            <span>{user.phone || "Not provided"}</span>
          </div>
        </div>

        <button
          style={styles.button}
          onClick={() => navigate("/orders")}
        >
          MY ORDERS
        </button>

        <button
          style={styles.logoutButton}
          onClick={handleLogout}
        >
          LOG OUT
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "70vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "32px 16px",
    backgroundColor: "#f8f7f4",
  },
  card: {
    width: "100%",
    maxWidth: "480px",
    padding: "36px 28px",
    backgroundColor: "#ffffff",
    boxSizing: "border-box",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
  },
  brand: {
    display: "block",
    textAlign: "center",
    fontSize: "22px",
    fontWeight: 700,
    letterSpacing: "4px",
    color: "#222222",
    textDecoration: "none",
    marginBottom: "28px",
  },
  title: {
    textAlign: "center",
    fontSize: "28px",
    color: "#222222",
  },
  subtitle: {
    textAlign: "center",
    color: "#777777",
    marginBottom: "30px",
  },
  details: {
    borderTop: "1px solid #eeeeee",
    marginBottom: "24px",
  },
  row: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    padding: "17px 0",
    borderBottom: "1px solid #eeeeee",
    overflowWrap: "anywhere",
  },
  label: {
    fontSize: "13px",
    color: "#777777",
  },
  value: {
    overflowWrap: "anywhere",
  },
  button: {
    width: "100%",
    padding: "14px",
    backgroundColor: "#222222",
    color: "#ffffff",
    border: "none",
    cursor: "pointer",
    marginBottom: "12px",
  },
  logoutButton: {
    width: "100%",
    padding: "14px",
    backgroundColor: "#ffffff",
    color: "#222222",
    border: "1px solid #222222",
    cursor: "pointer",
  },
};