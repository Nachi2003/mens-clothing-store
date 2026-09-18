function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">

        <div className="footer-brand">
          <h2>MEN'S STORE</h2>

          <p>
            Timeless menswear designed for everyday confidence,
            comfort, and style.
          </p>
        </div>

        <div className="footer-column">
          <h3>SHOP</h3>

          <a href="/shop">All Products</a>
          <a href="/shop?category=shirts">Shirts</a>
          <a href="/shop?category=t-shirts">T-Shirts</a>
          <a href="/shop?category=trousers">Trousers</a>
          <a href="/shop?category=jeans">Jeans</a>
        </div>

        <div className="footer-column">
          <h3>ACCOUNT</h3>

          <a href="/login">Login</a>
          <a href="/register">Create Account</a>
          <a href="/cart">Shopping Bag</a>
          <a href="/orders">My Orders</a>
        </div>

        <div className="footer-column">
          <h3>HELP</h3>

          <a href="/contact">Contact Us</a>
          <a href="/shipping">Shipping</a>
          <a href="/returns">Returns</a>
          <a href="/privacy">Privacy Policy</a>
        </div>

      </div>

      <div className="footer-bottom">
        <p>© 2026 Men's Store. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;