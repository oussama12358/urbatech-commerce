import { Link, NavLink, Outlet } from "react-router-dom";
import { LogIn, ShoppingCart, UserRound } from "lucide-react";
import { useStore } from "../store/StoreContext.jsx";
import Footer from "../client/components/Footer.jsx";
import GlobalToast from "../shared/components/GlobalToast.jsx";

export default function ClientLayout() {
  const { cartCount, user, settings } = useStore();

  return (
    <div className="app">
      <header className="topbar">
        <Link className="brand" to="/store">
          <div className="brand-mark">U</div>
          <div className="brand-text">
            <strong>URBA TECH</strong>
            <span>INTER</span>
          </div>
        </Link>

        <nav className="nav" aria-label="Main navigation">
          {settings.storefrontEnabled && <NavLink to="/store">Store</NavLink>}
          {user && <NavLink to="/orders">Orders</NavLink>}
          {user && <NavLink to="/account">Account</NavLink>}
        </nav>

        <div className="actions">
          <Link className="icon-btn" to={user ? "/account" : "/login"}>
            {user ? <UserRound /> : <LogIn />}
            {user ? user.name.split(" ")[0] : "Login"}
          </Link>
          {settings.storefrontEnabled && (
            <Link className="primary-btn" to="/cart">
              <ShoppingCart />
              Cart <span>{cartCount}</span>
            </Link>
          )}
        </div>
      </header>

      <div className="page-wrap">
        <Outlet />
      </div>

        <Footer />
        <GlobalToast />
    </div>
  );
}
