
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { getAuthToken } from "../services/authService";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const API_URL = `${API_BASE_URL}/api/users`;

interface StaffMember {
  userId: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
}

interface StaffForm {
  name: string;
  email: string;
  phone: string;
  password: string;
}

const emptyForm: StaffForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
};

async function readResponse(response: Response): Promise<any> {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function getErrorMessage(result: any, status: number): string {
  if (result?.message) {
    return result.message;
  }

  if (status === 401) {
    return "Your session has expired. Please log in again.";
  }

  if (status === 403) {
    return "Only Admins can manage staff accounts.";
  }

  if (status === 404) {
    return "The requested staff member was not found.";
  }

  if (status === 409) {
    return "This email address is already registered.";
  }

  return "Something went wrong. Please try again.";
}

export default function StaffManagementPage() {
  const [form, setForm] = useState<StaffForm>(emptyForm);

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [createdStaff, setCreatedStaff] =
    useState<StaffMember | null>(null);

  const [selectedStaff, setSelectedStaff] =
    useState<StaffMember | null>(null);

  const [editingStaffId, setEditingStaffId] =
    useState<number | null>(null);

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [detailsLoading, setDetailsLoading] = useState(false);

  const getHeaders = useCallback((): HeadersInit => {
    const token = getAuthToken();

    if (!token) {
      throw new Error(
        "Admin session not found. Please log in again."
      );
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, []);

  const loadStaff = useCallback(async () => {
    setListLoading(true);

    try {
      const response = await fetch(`${API_URL}/staff`, {
        method: "GET",
        headers: getHeaders(),
      });

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(result, response.status)
        );
      }

      if (!Array.isArray(result)) {
        throw new Error(
          "The server returned an unexpected staff list."
        );
      }

      setStaff(result);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load staff accounts."
      );
    } finally {
      setListLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return staff;
    }

    return staff.filter((member) =>
      [
        String(member.userId),
        member.name,
        member.email,
        member.phone ?? "",
        member.role,
      ].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [staff, search]);

  const handleCreate = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setMessage("");
    setError("");
    setCreatedStaff(null);

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/staff`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
        }),
      });

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(result, response.status)
        );
      }

      setCreatedStaff(result as StaffMember);
      setMessage("Staff account created successfully!");
      setForm(emptyForm);

      await loadStaff();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create staff account."
      );
    } finally {
      setLoading(false);
    }
  };

  const openStaffDetails = async (id: number) => {
    setMessage("");
    setError("");
    setDetailsLoading(true);
    setSelectedStaff(null);
    setEditingStaffId(null);

    try {
      const response = await fetch(
        `${API_URL}/staff/${id}`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(result, response.status)
        );
      }

      setSelectedStaff(result as StaffMember);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load staff details."
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const startEditing = (member: StaffMember) => {
    setEditingStaffId(member.userId);

    setEditForm({
      name: member.name,
      email: member.email,
      phone: member.phone ?? "",
    });

    setMessage("");
    setError("");
  };

  const cancelEditing = () => {
    setEditingStaffId(null);
    setEditForm({
      name: "",
      email: "",
      phone: "",
    });
  };

  const handleEdit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (editingStaffId === null) {
      return;
    }

    setMessage("");
    setError("");
    setSavingEdit(true);

    try {
      const response = await fetch(
        `${API_URL}/staff/${editingStaffId}`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({
            name: editForm.name.trim(),
            email: editForm.email.trim(),
            phone: editForm.phone.trim(),
          }),
        }
      );

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(result, response.status)
        );
      }

      setSelectedStaff(result as StaffMember);
      setEditingStaffId(null);
      setMessage("Staff details updated successfully!");

      await loadStaff();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update staff details."
      );
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="staff-management">
      <div className="staff-page-header">
        <div>
          <h2>Staff Management</h2>
          <p>
            Create staff accounts and manage your store team.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadStaff()}
          disabled={listLoading}
          className="staff-secondary-button"
        >
          {listLoading ? "Refreshing..." : "Refresh Staff"}
        </button>
      </div>

      {message && (
        <div className="staff-message" role="status">
          {message}
        </div>
      )}

      {error && (
        <div className="staff-error" role="alert">
          {error}
        </div>
      )}

      {/* Create staff */}
      <section className="staff-card">
        <h3>Create Staff Account</h3>
        <p className="staff-section-description">
          Add a new staff member to your store.
        </p>

        <form onSubmit={handleCreate}>
          <div className="staff-form-grid">
            <div className="staff-field">
              <label htmlFor="staff-name">Full Name</label>
              <input
                id="staff-name"
                type="text"
                value={form.name}
                onChange={(event) =>
                  setForm({
                    ...form,
                    name: event.target.value,
                  })
                }
                placeholder="Enter full name"
                required
                maxLength={100}
              />
            </div>

            <div className="staff-field">
              <label htmlFor="staff-email">
                Email Address
              </label>
              <input
                id="staff-email"
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm({
                    ...form,
                    email: event.target.value,
                  })
                }
                placeholder="Enter email address"
                required
                maxLength={150}
              />
            </div>

            <div className="staff-field">
              <label htmlFor="staff-phone">
                Phone Number
              </label>
              <input
                id="staff-phone"
                type="tel"
                value={form.phone}
                onChange={(event) =>
                  setForm({
                    ...form,
                    phone: event.target.value,
                  })
                }
                placeholder="Enter phone number"
                maxLength={20}
              />
            </div>

            <div className="staff-field">
              <label htmlFor="staff-password">
                Temporary Password
              </label>
              <input
                id="staff-password"
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm({
                    ...form,
                    password: event.target.value,
                  })
                }
                placeholder="Minimum 8 characters"
                required
                minLength={8}
                maxLength={100}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="staff-primary-button"
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : "Create Staff Account"}
          </button>
        </form>

        {createdStaff && (
          <div className="staff-created-summary">
            <h4>New Staff Account Created</h4>
            <p>
              <strong>Staff ID:</strong>{" "}
              {createdStaff.userId}
            </p>
            <p>
              <strong>Name:</strong> {createdStaff.name}
            </p>
            <p>
              <strong>Email:</strong> {createdStaff.email}
            </p>
            <p>
              <strong>Phone:</strong>{" "}
              {createdStaff.phone || "Not provided"}
            </p>
            <p>
              <strong>Role:</strong> {createdStaff.role}
            </p>
          </div>
        )}
      </section>

      {/* Staff list */}
      <section className="staff-card staff-list-card">
        <div className="staff-list-heading">
          <div>
            <h3>Staff Accounts</h3>
            <p className="staff-section-description">
              View staff details and update contact information.
            </p>
          </div>

          <span className="staff-count">
            {staff.length}{" "}
            {staff.length === 1 ? "Staff Member" : "Staff Members"}
          </span>
        </div>

        <div className="staff-search">
          <label htmlFor="staff-search">Search Staff</label>
          <input
            id="staff-search"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search by ID, name, email, phone or role"
          />
        </div>

        {listLoading ? (
          <p className="staff-empty-state">
            Loading staff accounts...
          </p>
        ) : filteredStaff.length === 0 ? (
          <p className="staff-empty-state">
            {staff.length === 0
              ? "No staff accounts found. Create your first staff account above."
              : "No staff members match your search."}
          </p>
        ) : (
          <div className="staff-table-wrapper">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>Staff ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredStaff.map((member) => (
                  <tr key={member.userId}>
                    <td data-label="Staff ID">
                      {member.userId}
                    </td>
                    <td data-label="Name">{member.name}</td>
                    <td data-label="Email">{member.email}</td>
                    <td data-label="Phone">
                      {member.phone || "—"}
                    </td>
                    <td data-label="Role">
                      <span className="staff-role">
                        {member.role}
                      </span>
                    </td>
                    <td data-label="Actions">
                      <div className="staff-row-actions">
                        <button
                          type="button"
                          className="staff-secondary-button"
                          onClick={() =>
                            void openStaffDetails(member.userId)
                          }
                        >
                          View / Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Staff details and edit form */}
      {detailsLoading && (
        <section className="staff-card">
          <p>Loading staff details...</p>
        </section>
      )}

      {selectedStaff && !detailsLoading && (
        <section className="staff-card staff-details-card">
          <div className="staff-list-heading">
            <div>
              <h3>Staff Details</h3>
              <p className="staff-section-description">
                Staff ID: {selectedStaff.userId}
              </p>
            </div>

            <button
              type="button"
              className="staff-secondary-button"
              onClick={() => {
                setSelectedStaff(null);
                cancelEditing();
              }}
            >
              Close
            </button>
          </div>

          {editingStaffId === selectedStaff.userId ? (
            <form onSubmit={handleEdit}>
              <div className="staff-form-grid">
                <div className="staff-field">
                  <label htmlFor="edit-staff-name">
                    Full Name
                  </label>
                  <input
                    id="edit-staff-name"
                    type="text"
                    value={editForm.name}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        name: event.target.value,
                      })
                    }
                    required
                    maxLength={100}
                  />
                </div>

                <div className="staff-field">
                  <label htmlFor="edit-staff-email">
                    Email Address
                  </label>
                  <input
                    id="edit-staff-email"
                    type="email"
                    value={editForm.email}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        email: event.target.value,
                      })
                    }
                    required
                    maxLength={150}
                  />
                </div>

                <div className="staff-field">
                  <label htmlFor="edit-staff-phone">
                    Phone Number
                  </label>
                  <input
                    id="edit-staff-phone"
                    type="tel"
                    value={editForm.phone}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        phone: event.target.value,
                      })
                    }
                    maxLength={20}
                  />
                </div>
              </div>

              <p className="staff-edit-note">
                The staff role and password are not changed by
                this form.
              </p>

              <div className="staff-actions">
                <button
                  type="submit"
                  className="staff-primary-button"
                  disabled={savingEdit}
                >
                  {savingEdit
                    ? "Saving Changes..."
                    : "Save Changes"}
                </button>

                <button
                  type="button"
                  className="staff-secondary-button"
                  disabled={savingEdit}
                  onClick={cancelEditing}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="staff-details-grid">
                <div>
                  <span>Full Name</span>
                  <strong>{selectedStaff.name}</strong>
                </div>

                <div>
                  <span>Email Address</span>
                  <strong>{selectedStaff.email}</strong>
                </div>

                <div>
                  <span>Phone Number</span>
                  <strong>
                    {selectedStaff.phone || "Not provided"}
                  </strong>
                </div>

                <div>
                  <span>Role</span>
                  <strong>{selectedStaff.role}</strong>
                </div>
              </div>

              <button
                type="button"
                className="staff-primary-button"
                onClick={() => startEditing(selectedStaff)}
              >
                Edit Staff Details
              </button>
            </>
          )}
        </section>
      )}
    </div>
  );
}
