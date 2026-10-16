import { useEffect, useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  getLoggedInUser,
  logoutUser,
} from "../services/authService";
import "./StaffAdminLayout.css";

type IconName =
  | "home"
  | "box"
  | "categories"
  | "sales"
  | "staff"
  | "reports"
  | "logout"
  | "menu"
  | "external"
  | "chevron";

const iconPaths: Record<IconName, string> = {
  home: "M3 10.5 12 3l9 7.5M5.5 9v11h13V9M9 20v-7h6v7",

  box: "m12 3 9 4.5v9L12 21l-9-4.5v-9L12 3Zm-9 4.5 9 5 9-5M12 12.5V21",

  categories:
    "M4 4h7v7H4zM14 4h6v7h-6zM4 14h7v6H4zM14 14h6v6h-6z",

  sales: "M4 19V5m0 14h16M7 15l4-5 3 2 5-7",

  staff:
    "M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6-7a4 4 0 0 1 0 7m2 4a4 4 0 0 1 3 4v2",

  reports: "M4 19V5m0 14h16M8 15V9m4 6V5m4 10v-4",

  logout:
    "M10 17l5-5-5-5m5 5H3m9-9h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7",

  menu: "M4 6h16M4 12h16M4 18h16",

  external:
    "M14 3h7v7m-1-6-9 9m5-2v9H4V8h9",

  chevron: "m9 18 6-6-6-6",
};

function Icon({
  name,
  size = 20,
}: {
  name: IconName;
  size?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
    >
      <path d={iconPaths[name]} />
    </svg>
  );
}

type MenuItem = {
  label: string;
  path: string;
  icon: IconName;
  end?: boolean;
};

export default function StaffAdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const user = getLoggedInUser();

  const isAuthorized =
    !!user && ["ADMIN", "STAFF"].includes(user.role);

  const isAdmin = user?.role === "ADMIN";

  const dashboardPath = isAdmin
    ? "/staff-admin/admin"
    : "/staff-admin/staff";

  useEffect(() => {
    if (!isAuthorized) {
      navigate("/staff-admin/login", { replace: true });
    }
  }, [isAuthorized, navigate]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  if (!isAuthorized || !user) {
    return null;
  }

  const workspaceItems: MenuItem[] = [
    {
      label: "Dashboard",
      path: dashboardPath,
      icon: "home",
      end: true,
    },
    {
      label: "Products & Inventory",
      path: "/staff-admin/products",
      icon: "box",
    },
    {
      label: "Categories",
      path: "/staff-admin/categories",
      icon: "categories",
    },
    {
      label: "Sales & Billing",
      path: "/staff-admin/sales",
      icon: "sales",
    },
  ];

  const administrationItems: MenuItem[] = isAdmin
    ? [
        {
          label: "Staff Management",
          path: "/staff-admin/team",
          icon: "staff",
        },
        {
          label: "Reports",
          path: "/staff-admin/reports",
          icon: "reports",
        },
      ]
    : [];

  const allMenuItems = [
    ...workspaceItems,
    ...administrationItems,
  ];

  const currentItem = allMenuItems.find(
    (item) => item.path === location.pathname
  );

  const currentPage =
    currentItem?.label ??
    (isAdmin ? "Admin Dashboard" : "Staff Dashboard");

  const initial =
    user.name?.trim().charAt(0).toUpperCase() || "U";

  function handleLogout() {
    logoutUser();
    navigate("/staff-admin/login", { replace: true });
  }

  function renderMenuItem(item: MenuItem) {
    return (
      <NavLink
        key={item.path}
        to={item.path}
        end={item.end}
        className={({ isActive }) =>
          `uz-nav-link${isActive ? " active" : ""}`
        }
        aria-label={item.label}
      >
        <span className="uz-nav-icon">
          <Icon name={item.icon} size={21} />
        </span>

        <span className="uz-nav-label">
          {item.label}
        </span>

        <span className="uz-nav-chevron">
          <Icon name="chevron" size={16} />
        </span>
      </NavLink>
    );
  }

  return (
    <div className="uz-admin-layout">
      {menuOpen && (
        <button
          type="button"
          className="uz-sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside
        id="uz-sidebar"
        className={`uz-sidebar${
          menuOpen ? " uz-sidebar-open" : ""
        }`}
        aria-label="Staff and admin sidebar"
      >
        <NavLink
          to={dashboardPath}
          className="uz-brand"
          aria-label="UNIQUE ZONE dashboard"
        >
          <span className="uz-brand-name">
            UNIQUE ZONE
          </span>

          <span className="uz-brand-tagline">
            THE FASHION GARAGE
          </span>
        </NavLink>

        <div className="uz-sidebar-section-label">
          WORKSPACE
        </div>

        <nav
          className="uz-navigation"
          aria-label="Main navigation"
        >
          {workspaceItems.map(renderMenuItem)}

          {administrationItems.length > 0 && (
            <>
              <div className="uz-sidebar-section-label uz-admin-label">
                ADMINISTRATION
              </div>

              {administrationItems.map(renderMenuItem)}
            </>
          )}
        </nav>

        <div className="uz-sidebar-bottom">
          <NavLink
            to="/shop"
            className="uz-nav-link uz-store-link"
          >
            <span className="uz-nav-icon">
              <Icon name="external" size={21} />
            </span>

            <span className="uz-nav-label">
              View Customer Store
            </span>

            <span className="uz-nav-chevron">
              <Icon name="chevron" size={16} />
            </span>
          </NavLink>

          <div className="uz-sidebar-divider" />

          <div className="uz-sidebar-user">
            <div className="uz-avatar">
              {initial}
            </div>

            <div className="uz-user-details">
              <strong>
                {user.name || "User"}
              </strong>

              <span>
                {isAdmin ? "Administrator" : "Staff Member"}
              </span>
            </div>

            <button
              type="button"
              className="uz-logout-button"
              onClick={handleLogout}
              aria-label="Sign out"
              title="Sign out"
            >
              <Icon name="logout" size={20} />
            </button>
          </div>
        </div>
      </aside>

      <div className="uz-main-area">
        <header className="uz-topbar">
          <div className="uz-breadcrumb">
            <button
              type="button"
              className="uz-mobile-menu-button"
              onClick={() =>
                setMenuOpen((open) => !open)
              }
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
              aria-controls="uz-sidebar"
            >
              <Icon name="menu" size={22} />
            </button>

            <span className="uz-home-symbol">
              <Icon name="home" size={18} />
            </span>

            <span
              className="uz-breadcrumb-divider"
              aria-hidden="true"
            >
              /
            </span>

            <span>{isAdmin ? "Admin" : "Staff"}</span>

            <span
              className="uz-breadcrumb-divider"
              aria-hidden="true"
            >
              /
            </span>

            <strong>{currentPage}</strong>
          </div>

          <div className="uz-topbar-actions">
            <NavLink
              to="/shop"
              className="uz-topbar-store"
            >
              <Icon name="external" size={17} />

              <span className="uz-topbar-store-text">
                View Customer Store
              </span>
            </NavLink>

            <div className="uz-topbar-profile">
              <div className="uz-avatar uz-topbar-avatar">
                {initial}
              </div>

              <div className="uz-topbar-user-details">
                <span className="uz-profile-name">
                  {user.name || "User"}
                </span>

                <span className="uz-profile-role">
                  {isAdmin ? "ADMIN" : "STAFF"}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="uz-page-content">
          <Outlet />

          <footer className="uz-footer">
            <span>
              UNIQUE ZONE · THE FASHION GARAGE
            </span>

            <span>
              {isAdmin ? "Admin Portal" : "Staff Portal"}
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}