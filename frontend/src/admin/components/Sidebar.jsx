import { NavLink } from "react-router-dom";
import { BadgeDollarSign, BarChart3, Boxes, Gauge, ListOrdered, Settings, Tags, Truck, UsersRound } from "lucide-react";
import { t, useLocale } from "../../i18n.js";

const links = [
  { to: "/admin/dashboard", label: "adminDashboard", icon: Gauge },
  { to: "/admin/products", label: "products", icon: Boxes },
  { to: "/admin/orders", label: "orders", icon: ListOrdered },
  { to: "/admin/payments", label: "payments", icon: Settings },
  { to: "/admin/settlements", label: "adminSettlements", icon: BadgeDollarSign },
  { to: "/admin/reports", label: "adminReports", icon: BarChart3 },
  { to: "/admin/customers", label: "adminCustomers", icon: UsersRound },
  { to: "/admin/categories", label: "categories", icon: Tags },
  { to: "/admin/suppliers", label: "adminSuppliers", icon: Truck },
  { to: "/admin/settings", label: "settings", icon: Settings }
];

export default function Sidebar() {
  useLocale();

  return (
    <aside className="admin-sidebar">
      <NavLink className="brand admin-brand" to="/admin/dashboard">
        <span className="brand-mark">UTI</span>
        <span className="brand-text">
          URBA TECH <span>INTER</span>
        </span>
      </NavLink>
      <nav className="admin-nav" aria-label={t("adminNavigation")}> 
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}>
            <Icon />
            {t(label)}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
