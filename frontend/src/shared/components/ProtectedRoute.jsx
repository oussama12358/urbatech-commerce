import { Navigate, useLocation } from "react-router-dom";
import { useStore } from "../../store/StoreContext.jsx";
import Loading from "./Loading.jsx";

export default function ProtectedRoute({ children, role }) {
  const { user, authReady } = useStore();
  const location = useLocation();

  if (!authReady) {
    return <Loading label="Checking session..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ next: location.pathname + location.search }} />;
  }

  if (role && user.role?.toLowerCase() !== role.toLowerCase()) {
    return <Navigate to={role.toLowerCase() === "admin" ? "/account" : "/store"} replace />;
  }

  return children;
}
