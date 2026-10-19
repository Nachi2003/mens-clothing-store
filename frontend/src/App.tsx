
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CategoryManagementPage from "./pages/CategoryManagementPage";
import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import CartPage from "./pages/CartPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import ProfilePage from "./pages/ProfilePage";
import ProductManagementPage from "./pages/ProductManagementPage";
import StaffAdminLoginPage from "./pages/StaffAdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import StaffDashboardPage from "./pages/StaffDashboardPage";
import StaffManagementPage from "./pages/StaffManagementPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import StaffOrdersPage from "./pages/StaffOrdersPage";
import ReportsPage from "./pages/ReportsPage";
import StaffAdminLayout from "./layouts/StaffAdminLayout";

import Header from "./components/Header";
import Footer from "./components/Footer";

import "./App.css";

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsLoading(false);
    }, 1800);

    return () => window.clearTimeout(timer);
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
          <div className="unique-zone-loader-name">UNIQUE ZONE</div>
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
      <Routes>
        {/* Customer storefront */}
        <Route
          path="/"
          element={<><Header /><HomePage /><Footer /></>}
        />
        <Route
          path="/shop"
          element={<><Header /><ShopPage /><Footer /></>}
        />
        <Route
          path="/product/:productId"
          element={<><Header /><ProductDetailsPage /><Footer /></>}
        />
        <Route
          path="/cart"
          element={<><Header /><CartPage /><Footer /></>}
        />
        <Route
          path="/login"
          element={<><Header /><LoginPage /><Footer /></>}
        />
        <Route
          path="/register"
          element={<><Header /><RegisterPage /><Footer /></>}
        />
        <Route
          path="/checkout"
          element={<><Header /><CheckoutPage /><Footer /></>}
        />
        <Route
          path="/orders"
          element={<><Header /><OrderHistoryPage /><Footer /></>}
        />
        <Route
          path="/order-success"
          element={<><Header /><OrderSuccessPage /><Footer /></>}
        />
        <Route
          path="/profile"
          element={<><Header /><ProfilePage /><Footer /></>}
        />

        {/* Staff/Admin login */}
        <Route
          path="/staff-admin/login"
          element={<StaffAdminLoginPage />}
        />

        {/* Staff/Admin portal */}
        <Route element={<StaffAdminLayout />}>
          <Route
            path="/staff-admin/admin"
            element={<AdminDashboardPage />}
          />
          <Route
            path="/staff-admin/staff"
            element={<StaffDashboardPage />}
          />
          <Route
            path="/staff-admin/team"
            element={<StaffManagementPage />}
          />

          {/* Temporary routes to prevent unmatched-route warnings */}
          <Route
  path="/staff-admin/products"
  element={<ProductManagementPage />}
/>
          <Route
            path="/staff-admin/sales"
            element={<StaffOrdersPage />}
          />
          <Route
            path="/staff-admin/reports"
            element={<ReportsPage />}
          />
          <Route
            path="/staff-admin/categories"
            element={<CategoryManagementPage />}
          />
        </Route>

        {/* Unknown paths */}
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route
  path="/orders/:orderId"
  element={
    <>
      <Header />
      <OrderDetailsPage />
      <Footer />
    </>
  }
/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
