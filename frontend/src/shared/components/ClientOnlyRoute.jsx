import { Navigate } from "react-router-dom";
import { useStore } from "../../store/StoreContext.jsx";
import Loading from "./Loading.jsx";

export default function ClientOnlyRoute({ children }) {
  const { user, authReady } = useStore();

  if (!authReady) {
    return <Loading label="Checking session..." />;
  }

  if (user?.role?.toLowerCase() === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}
