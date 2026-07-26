import { Navigate, Route } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout.jsx";
import ProtectedRoute from "../../shared/components/ProtectedRoute.jsx";
import AddProduct from "../pages/AddProduct.jsx";
import Categories from "../pages/Categories.jsx";
import Customers from "../pages/Customers.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import EditProduct from "../pages/EditProduct.jsx";
import OrderDetails from "../pages/OrderDetails.jsx";
import Orders from "../pages/Orders.jsx";
import Products from "../pages/Products.jsx";
import Reports from "../pages/Reports.jsx";
import Settlements from "../pages/Settlements.jsx";
import Settings from "../pages/Settings.jsx";
import PaymentProviders from "../pages/PaymentProviders.jsx";
import Suppliers from "../pages/Suppliers.jsx";
import CustomerDetails from "../pages/CustomerDetails.jsx";

export default function AdminRoutes() {
  return (
    <Route
      path="/admin"
      element={
        <ProtectedRoute role="admin">
          <AdminLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="products" element={<Products />} />
      <Route path="products/new" element={<AddProduct />} />
      <Route path="products/:id/edit" element={<EditProduct />} />
      <Route path="orders" element={<Orders />} />
      <Route path="orders/:id" element={<OrderDetails />} />
      <Route path="customers" element={<Customers />} />
      <Route path="customers/:id" element={<CustomerDetails />} />
      <Route path="categories" element={<Categories />} />
      <Route path="suppliers" element={<Suppliers />} />
      
      <Route path="payments" element={<PaymentProviders />} />
      <Route path="settlements" element={<Settlements />} />
      <Route path="reports" element={<Reports />} />
      <Route path="settings" element={<Settings />} />
    </Route>
  );
}
