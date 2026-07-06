import { Link } from "react-router-dom";
import { LogOut, UserRound } from "lucide-react";
import { useStore } from "../../store/StoreContext.jsx";

export default function Topbar() {
  const { user } = useStore();

  const displayName = user?.name?.split(" ")[0] || "Account";

  return (
    <header className="admin-topbar">
      <div>
        <p className="eyebrow">Admin workspace</p>
        <h1>Commerce operations</h1>
      </div>
      <div className="actions">
        <span className="icon-btn avatar-pill" title={displayName}>
          <UserRound />
          {displayName}
          <span className="avatar-caret">▼</span>
        </span>
        <Link className="icon-btn" to="/logout" aria-label="Logout">
          <LogOut />
        </Link>
      </div>
    </header>
  );
}
