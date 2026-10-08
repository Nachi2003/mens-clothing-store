import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProfilePage from "./pages/ProfilePage";
import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import CartPage from "./pages/CartPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CheckoutPage from "./pages/CheckoutPage";
import Header from "./components/Header";
import Footer from "./components/Footer";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import "./App.css";

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsLoading(false);
    }, 1800);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="unique-zone-loader">
        <div className="unique-zone-loader-content">
          <img
            src="/images/unique-zone-logo.png"
            alt="Unique Zone - The Fashion Garage"
            className="unique-zone-loader-logo"
          />

          <div className="unique-zone-loader-name">
            UNIQUE ZONE
          </div>

          <div className="unique-zone-loader-tagline">
            The Fashion Garage
          </div>

          <div className="unique-zone-loader-line" />
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Header />

      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/shop" element={<ShopPage />} />

        <Route
          path="/product/:productId"
          element={<ProductDetailsPage />}
        />

        <Route path="/cart" element={<CartPage />} />

        {/* Authentication routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrderHistoryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}

export default App;