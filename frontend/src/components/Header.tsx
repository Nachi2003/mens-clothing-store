import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { getLoggedInUser, logoutUser } from "../services/authService";
import type { User } from "../services/authService";
import { getBackendCart } from "../services/backendCartService";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState<User | null>(getLoggedInUser());

  const location = useLocation();
  const navigate = useNavigate();

  const closeMenu = () => setMenuOpen(false);

  const updateCartCount = useCallback(async () => {
    const loggedInUser = getLoggedInUser();
    setUser(loggedInUser);

    if (!loggedInUser) {
      setCartCount(0);
      return;
    }

    try {
      const cart = await getBackendCart();

      setCartCount(
        cart.items.reduce((total, item) => total + item.quantity, 0)
      );
    } catch (error) {
      console.error("Unable to load cart count:", error);
      setCartCount(0);
    }
  }, []);

  useEffect(() => {
    updateCartCount();

    window.addEventListener("cartUpdated", updateCartCount);

    return () => {
      window.removeEventListener("cartUpdated", updateCartCount);
    };
  }, [updateCartCount, location.pathname]);

  useEffect(() => {
    closeMenu();
    setAccountOpen(false);
  }, [location.pathname]);

  // Prevent background scrolling while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setCartCount(0);
    setAccountOpen(false);
    closeMenu();
    navigate("/");
  };

  const categories = [
    { label: "New In", to: "/" },
    { label: "Shirts", to: "/shop?category=shirts" },
    { label: "Pants", to: "/shop?category=pants" },
    { label: "T-Shirts", to: "/shop?category=t-shirts" },
    { label: "Jackets", to: "/shop?category=jackets" },
    { label: "Accessories", to: "/shop?category=accessories" },
  ];

  return (
    <>
      {/* Announcement bar */}
      <div className="lat-announcement">
        <span className="lat-announcement-desktop">
          STYLE FOR EVERY MOMENT. ONLINE · IN-STORE · ALWAYS WITH YOU.
        </span>

        <span className="lat-announcement-mobile">
          STYLE FOR EVERY MOMENT · ONLINE & IN-STORE
        </span>
      </div>

      {/* Main header */}
      <header className="lat-header">
        <div className="lat-header-inner">
          {/* Mobile menu button */}
          <button
            type="button"
            className="lat-menu-trigger"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
          >
            <span />
            <span />
          </button>

          {/* Logo */}
          <Link to="/" className="lat-logo">
            <img
              src="/images/unique-zone-logo.png"
              alt="Unique Zone - The Fashion Garage"
              className="lat-logo-image"
            />
          </Link>

          {/* Desktop navigation */}
          <nav className="lat-desktop-nav">
            {categories.map((category) => (
              <Link key={category.label} to={category.to}>
                {category.label}
              </Link>
            ))}
          </nav>

          {/* Header actions */}
          <div className="lat-header-actions">
            <button
              type="button"
              className="lat-icon-button"
              aria-label="Search"
              onClick={() => navigate("/shop")}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="10.8" cy="10.8" r="6.5" />
                <path d="m16 16 4.5 4.5" />
              </svg>
            </button>

            {/* Account dropdown */}
            <div className="lat-account-wrapper">
              <button
                type="button"
                className="lat-icon-button"
                aria-label="Account menu"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen((open) => !open)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="7.5" r="3.5" />
                  <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
                </svg>
              </button>

              {accountOpen && (
                <div className="lat-account-dropdown">
                  {user ? (
                    <>
                      <div className="lat-account-heading">
                        <span className="lat-account-avatar">
                          {user.name.charAt(0).toUpperCase()}
                        </span>

                        <div>
                          <p>Hello, {user.name}</p>
                          <span>{user.email}</span>
                        </div>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setAccountOpen(false)}
                      >
                        My Profile
                      </Link>

                      <Link
                        to="/orders"
                        onClick={() => setAccountOpen(false)}
                      >
                        My Orders
                      </Link>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="lat-account-logout"
                      >
                        Log Out
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="lat-account-title">Your Account</p>

                      <Link
                        to="/login"
                        onClick={() => setAccountOpen(false)}
                      >
                        Login
                      </Link>

                      <Link
                        to="/register"
                        onClick={() => setAccountOpen(false)}
                      >
                        Create Account
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Shopping bag */}
            <Link
              to="/cart"
              className="lat-bag-button"
              aria-label={`Shopping bag, ${cartCount} items`}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 8h14l1 13H4L5 8Z" />
                <path d="M9 9V6a3 3 0 0 1 6 0v3" />
              </svg>

              {cartCount > 0 && (
                <span className="lat-bag-count">{cartCount}</span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        className={`lat-drawer-overlay ${menuOpen ? "is-visible" : ""}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Mobile navigation drawer */}
      <aside
        className={`lat-mobile-drawer ${menuOpen ? "is-open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className="lat-drawer-header">
          <Link to="/" className="lat-logo" onClick={closeMenu}>
            <img
              src="/images/unique-zone-logo.png"
              alt="Unique Zone - The Fashion Garage"
              className="lat-logo-image"
            />
          </Link>

          <button
            type="button"
            className="lat-drawer-close"
            onClick={closeMenu}
            aria-label="Close navigation menu"
          >
            ×
          </button>
        </div>

        {/* Customer information */}
        <div className="lat-drawer-account">
          {user ? (
            <>
              <div className="lat-drawer-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>

              <div className="lat-drawer-user-info">
                <span className="lat-drawer-eyebrow">YOUR ACCOUNT</span>
                <h3>Hello, {user.name}!</h3>
                <p>{user.email}</p>
              </div>
            </>
          ) : (
            <div className="lat-drawer-user-info">
              <span className="lat-drawer-eyebrow">
                WELCOME TO UNIQUE ZONE
              </span>

              <h3>Discover your style.</h3>

              <div className="lat-drawer-auth">
                <Link to="/login" onClick={closeMenu}>
                  Login
                </Link>

                <Link to="/register" onClick={closeMenu}>
                  Create Account
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="lat-drawer-section">
          <span className="lat-drawer-section-label">DISCOVER</span>

          <nav className="lat-drawer-nav">
            {categories.map((category, index) => (
              <Link
                key={category.label}
                to={category.to}
                onClick={closeMenu}
              >
                <span className="lat-category-number">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span>{category.label}</span>

                <span className="lat-category-arrow">↗</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Account links */}
        {user && (
          <div className="lat-drawer-account-links">
            <Link to="/profile" onClick={closeMenu}>
              <span>♙</span>
              My Profile
              <span className="lat-link-arrow">→</span>
            </Link>

            <Link to="/orders" onClick={closeMenu}>
              <span>▤</span>
              My Orders
              <span className="lat-link-arrow">→</span>
            </Link>
          </div>
        )}

        {/* Shopping bag */}
        <Link
          to="/cart"
          className="lat-drawer-bag"
          onClick={closeMenu}
        >
          <span>SHOPPING BAG</span>
          <span className="lat-drawer-bag-count">{cartCount}</span>
        </Link>

        {/* Logout */}
        {user && (
          <button
            type="button"
            className="lat-drawer-logout"
            onClick={handleLogout}
          >
            Log Out <span>↗</span>
          </button>
        )}

        <div className="lat-drawer-footer">
          <span>TIMELESS STYLE. EVERYDAY COMFORT.</span>
        </div>
      </aside>
    </>
  );
}

export default Header;