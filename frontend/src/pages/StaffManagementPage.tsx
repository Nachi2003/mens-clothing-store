import { useState, type FormEvent } from "react";
import { getAuthToken } from "../services/authService";

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/users`;

interface CreatedStaff {
  userId: number;
  name: string;
  email: string;
  phone: string;
  role: string;
}

export default function StaffManagementPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [createdStaff, setCreatedStaff] =
    useState<CreatedStaff | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setMessage("");
    setError("");
    setCreatedStaff(null);

    const token = getAuthToken();

    if (!token) {
      setError("Admin session not found. Please log in again.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/staff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            (response.status === 403
              ? "Only Admins can create staff accounts."
              : "Failed to create staff account.")
        );
      }

      setCreatedStaff(result);
      setMessage("Staff account created successfully!");

      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="staff-management">
      <h2>Staff Management</h2>
      <p>Create a new staff account for your store.</p>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="staff-name">Full Name</label>
          <input
            id="staff-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter full name"
            required
            maxLength={100}
          />
        </div>

        <div>
          <label htmlFor="staff-email">Email Address</label>
          <input
            id="staff-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter email address"
            required
            maxLength={150}
          />
        </div>

        <div>
          <label htmlFor="staff-phone">Phone Number</label>
          <input
            id="staff-phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Enter phone number"
            required
            maxLength={20}
          />
        </div>

        <div>
          <label htmlFor="staff-password">Temporary Password</label>
          <input
            id="staff-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimum 8 characters"
            required
            minLength={8}
            maxLength={100}
            autoComplete="new-password"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Creating Account..." : "Create Staff Account"}
        </button>
      </form>

      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}

      {createdStaff && (
        <div>
          <h3>New Staff Account</h3>
          <p>Staff ID: {createdStaff.userId}</p>
          <p>Name: {createdStaff.name}</p>
          <p>Email: {createdStaff.email}</p>
          <p>Phone: {createdStaff.phone}</p>
          <p>Role: {createdStaff.role}</p>
        </div>
      )}
    </div>
  );
}