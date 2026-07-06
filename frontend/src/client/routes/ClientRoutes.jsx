import { Navigate, Route } from "react-router-dom";
import ClientLayout from "../../layouts/ClientLayout.jsx";
import ClientOnlyRoute from "../../shared/components/ClientOnlyRoute.jsx";
import ProtectedRoute from "../../shared/components/ProtectedRoute.jsx";
import StorefrontRoute from "../../shared/components/StorefrontRoute.jsx";
import AccountPage from "../pages/AccountPage.jsx";
import CartPage from "../pages/CartPage.jsx";
import CheckoutPage from "../pages/CheckoutPage.jsx";
import ForgotPasswordPage from "../pages/ForgotPasswordPage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import LogoutPage from "../pages/LogoutPage.jsx";
import OrderDetailsPage from "../pages/OrderDetailsPage.jsx";
import OrdersPage from "../pages/OrdersPage.jsx";
import ProductPage from "../pages/ProductPage.jsx";
import SignupPage from "../pages/SignupPage.jsx";
import StorePage from "../pages/StorePage.jsx";
import VerifyEmailPage from "../pages/VerifyEmailPage.jsx";
import ResetPasswordPage from "../pages/ResetPasswordPage.jsx";
import ResetSuccessPage from "../pages/ResetSuccessPage.jsx";

export default function ClientRoutes() {
  return (
    <>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/reset-success" element={<ResetSuccessPage />} />
      <Route path="/logout" element={<LogoutPage />} />
      <Route
        element={
          <ClientOnlyRoute>
            <ClientLayout />
          </ClientOnlyRoute>
        }
      >
        <Route index element={<Navigate to="/store" replace />} />
        <Route path="/store" element={<StorefrontRoute><StorePage /></StorefrontRoute>} />
        <Route path="/product/:id" element={<StorefrontRoute><ProductPage /></StorefrontRoute>} />
        <Route path="/cart" element={<StorefrontRoute><CartPage /></StorefrontRoute>} />
        <Route
          path="/checkout"
          element={
            <StorefrontRoute>
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            </StorefrontRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute>
              <OrderDetailsPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </>
  );
}
