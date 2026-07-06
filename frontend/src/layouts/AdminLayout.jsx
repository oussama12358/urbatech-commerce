import { Outlet } from "react-router-dom";
import Sidebar from "../admin/components/Sidebar.jsx";
import Topbar from "../admin/components/Topbar.jsx";
import GlobalToast from "../shared/components/GlobalToast.jsx";

export default function AdminLayout() {
  return (
    <div className="admin-shell">
      <Sidebar />
      <section className="admin-workspace">
        <Topbar />
        <Outlet />
        <GlobalToast />
      </section>
    </div>
  );
}
