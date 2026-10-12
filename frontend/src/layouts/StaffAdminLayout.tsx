import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getLoggedInUser, logoutUser } from "../services/authService";
import { useEffect } from "react";

export default function StaffAdminLayout() {
  const navigate = useNavigate();
  const user = getLoggedInUser();

  useEffect(() => {
    if (!user || !["ADMIN", "STAFF"].includes(user.role)) {
      navigate("/staff-admin/login", { replace: true });
    }
  }, [user, navigate]);

  if (!user || !["ADMIN", "STAFF"].includes(user.role)) {
    return null;
  }

  const isAdmin = user.role === "ADMIN";

  const handleLogout = () => {
    logoutUser();
    navigate("/staff-admin/login", { replace: true });
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `staff-admin-nav-link${isActive ? " active" : ""}`;

  return (
    <div className="staff-admin-layout">
      <aside className="staff-admin-sidebar">
        <div className="staff-admin-sidebar-brand">
          <h2>UNIQUE ZONE</h2>
          <p>THE FASHION GARAGE</p>
        </div>

        <div className="staff-admin-user">
          <div className="staff-admin-avatar">
            {user.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div>
            <strong>{user.name}</strong>
            <span>{isAdmin ? "Administrator" : "Staff Member"}</span>
          </div>
        </div>

        <nav className="staff-admin-navigation">
          <p className="staff-admin-nav-heading">WORKSPACE</p>

          <NavLink
            to={isAdmin ? "/staff-admin/admin" : "/staff-admin/staff"}
            className={linkClass}
            end
          >
            Dashboard
          </NavLink>

          <NavLink to="/staff-admin/products" className={linkClass}>
            Products & Inventory
          </NavLink>

          <NavLink to="/staff-admin/orders" className={linkClass}>
            Orders
          </NavLink>

          <NavLink to="/staff-admin/sales" className={linkClass}>
            Sales & Billing
          </NavLink>

          {isAdmin && (
            <>
              <p className="staff-admin-nav-heading">ADMINISTRATION</p>
              <NavLink to="/staff-admin/team" className={linkClass}>
                Staff Management
              </NavLink>
              <NavLink to="/staff-admin/reports" className={linkClass}>
                Reports
              </NavLink>
            </>
          )}
        </nav>

        <div className="staff-admin-sidebar-bottom">
          <NavLink to="/shop" className={linkClass}>
            View Customer Store
          </NavLink>

          <button
            type="button"
            className="staff-admin-logout"
            onClick={handleLogout}
          >
            Sign Out
          </button>
        </div>
      </aside>

      <main className="staff-admin-main">
        <header className="staff-admin-topbar">
          <div>
            <span className="staff-admin-topbar-label">
              UNIQUE ZONE / PORTAL
            </span>
            <h1>{isAdmin ? "Admin Portal" : "Staff Portal"}</h1>
          </div>

          <span className="staff-admin-role-badge">
            {user.role}
          </span>
        </header>

        <section className="staff-admin-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}