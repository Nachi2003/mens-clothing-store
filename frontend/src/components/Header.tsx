import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCartItemCount } from "../services/cartService";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const closeMenu = () => setMenuOpen(false);

  // Update cart count whenever the cart changes
  useEffect(() => {
    const updateCount = () => {
      setCartCount(getCartItemCount());
    };

    updateCount();

    window.addEventListener("cartUpdated", updateCount);

    return () => {
      window.removeEventListener("cartUpdated", updateCount);
    };
  }, []);

  return (
    <>
      {/* Announcement Bar */}
      <div className="top-bar">
        <span className="top-bar-desktop">
          STYLE FOR EVERY MOMENT. ONLINE · IN-STORE · ALWAYS WITH YOU.
        </span>

        <span className="top-bar-mobile">
          STYLE FOR EVERY MOMENT · ONLINE & IN-STORE
        </span>
      </div>

      {/* Main Header */}
      <header className="site-header">
        <div className="header-inner">

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? "✕" : "☰"}
          </button>

          {/* Logo */}
          <Link to="/" className="site-logo" onClick={closeMenu}>
            L'ATELIER
          </Link>

          {/* Desktop Navigation */}
          <nav className="desktop-navigation">
            <Link to="/">New In</Link>
            <Link to="/shop?category=shirts">Shirts</Link>
            <Link to="/shop?category=pants">Pants</Link>
            <Link to="/shop?category=t-shirts">T-Shirts</Link>
            <Link to="/shop?category=jackets">Jackets</Link>
            <Link to="/shop?category=accessories">Accessories</Link>
          </nav>

          {/* Header Actions */}
          <div className="header-actions">
            <button
              type="button"
              aria-label="Search"
              className="header-icon"
            >
              ⌕
            </button>

            <Link
              to="/login"
              aria-label="Account"
              className="header-icon"
            >
              ♙
            </Link>

            {/* Shopping Bag with Cart Count */}
            <Link
              to="/cart"
              aria-label={`Shopping bag, ${cartCount} items`}
              className="header-icon cart-icon"
              onClick={closeMenu}
            >
              🛍

              {cartCount > 0 && (
                <span className="cart-count">{cartCount}</span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <nav className="mobile-navigation">
            <Link to="/" onClick={closeMenu}>
              New In
            </Link>

            <Link to="/shop?category=shirts" onClick={closeMenu}>
              Shirts
            </Link>

            <Link to="/shop?category=pants" onClick={closeMenu}>
              Pants
            </Link>

            <Link to="/shop?category=t-shirts" onClick={closeMenu}>
              T-Shirts
            </Link>

            <Link to="/shop?category=jackets" onClick={closeMenu}>
              Jackets
            </Link>

            <Link to="/shop?category=accessories" onClick={closeMenu}>
              Accessories
            </Link>

            <div className="mobile-navigation-divider" />

            <Link to="/login" onClick={closeMenu}>
              Account
            </Link>

            <Link to="/cart" onClick={closeMenu}>
              Shopping Bag {cartCount > 0 && `(${cartCount})`}
            </Link>
          </nav>
        )}
      </header>
    </>
  );
}

export default Header;