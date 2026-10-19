import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCustomerAddress, saveCustomerAddress, type CustomerAddress } from "../services/customerAddressService";
import { getLoggedInUser, logoutUser } from "../services/authService";

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = getLoggedInUser();
  const [address, setAddress] = useState<CustomerAddress>({ address: "", city: "", state: "", pincode: "" });
  const [addressMessage, setAddressMessage] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    if (!user) return;
    getCustomerAddress().then((saved) => {
      if (saved) setAddress({ address: saved.address, city: saved.city, state: saved.state, pincode: saved.pincode });
    }).catch(() => {});
  }, [user?.userId]);

  const handleSaveAddress = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingAddress(true);
    setAddressMessage("");
    try {
      await saveCustomerAddress(address);
      setAddressMessage("Delivery address saved successfully.");
    } catch (error) {
      setAddressMessage(error instanceof Error ? error.message : "Unable to save address.");
    } finally {
      setSavingAddress(false);
    }
  };

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

        <form onSubmit={handleSaveAddress} style={{ marginBottom: 24, borderTop: "1px solid #eee", paddingTop: 18 }}>
          <h2 style={{ fontSize: 18 }}>Saved Delivery Address</h2>
          <label style={styles.label}>Address</label>
          <textarea required maxLength={500} value={address.address} onChange={(e) => setAddress({ ...address, address: e.target.value })} rows={3} style={styles.addressInput} placeholder="House number, street, area" />
          <label style={styles.label}>City</label>
          <input required maxLength={100} value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} style={styles.addressInput} />
          <label style={styles.label}>State</label>
          <input required maxLength={100} value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} style={styles.addressInput} />
          <label style={styles.label}>PIN Code</label>
          <input required pattern="[0-9]{6}" maxLength={6} value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} style={styles.addressInput} />
          {addressMessage && <p role="status">{addressMessage}</p>}
          <button style={styles.button} type="submit" disabled={savingAddress}>{savingAddress ? "SAVING..." : "SAVE ADDRESS"}</button>
        </form>

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
  addressInput: {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: "11px",
    margin: "7px 0 14px",
    border: "1px solid #ddd",
    font: "inherit",
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