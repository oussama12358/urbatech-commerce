import { Navigate } from "react-router-dom";
import { useStore } from "../../store/StoreContext.jsx";

export default function StorefrontClosedPage() {
  const { user } = useStore();

  if (user?.role?.toLowerCase() === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <main className="main">
      <section className="panel storefront-closed">
        <h1>Store is temporarily unavailable.</h1>
        <p className="lead">The catalogue and checkout are currently closed by the URBA TECH INTER team.</p>
      </section>
    </main>
  );
}
