import { useState } from "react";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header>
      <div>
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Open menu"
        >
          ☰
        </button>

        <a href="/">MEN'S STORE</a>

        <nav>
          <a href="/">Home</a>
          <a href="/shop">Shop</a>
          <a href="/categories">Categories</a>
        </nav>

        <div>
          <button type="button">Search</button>
          <a href="/login">Login</a>
          <a href="/cart">Cart</a>
        </div>
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          <a href="/" onClick={() => setMenuOpen(false)}>
            Home
          </a>

          <a href="/shop" onClick={() => setMenuOpen(false)}>
            Shop
          </a>

          <a href="/categories" onClick={() => setMenuOpen(false)}>
            Categories
          </a>

          <a href="/login" onClick={() => setMenuOpen(false)}>
            Login
          </a>

          <a href="/cart" onClick={() => setMenuOpen(false)}>
            Cart
          </a>
        </div>
      )}
    </header>
  );
}

export default Header;