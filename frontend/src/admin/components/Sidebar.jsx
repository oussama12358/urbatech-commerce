import { NavLink } from "react-router-dom";
import { BadgeDollarSign, BarChart3, Boxes, Gauge, ListOrdered, Settings, Tags, Truck, UsersRound } from "lucide-react";

const links = [
  { to: "/admin/dashboard", label: "Dashboard", icon: Gauge },
  { to: "/admin/products", label: "Products", icon: Boxes },
  { to: "/admin/orders", label: "Orders", icon: ListOrdered },
  { to: "/admin/payments", label: "Payments", icon: Settings },
  { to: "/admin/settlements", label: "Settlements", icon: BadgeDollarSign },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/customers", label: "Customers", icon: UsersRound },
  { to: "/admin/categories", label: "Categories", icon: Tags },
  { to: "/admin/suppliers", label: "Suppliers", icon: Truck },
  { to: "/admin/settings", label: "Settings", icon: Settings }
];

export default function Sidebar() {
  return (
    <aside className="admin-sidebar">
      <NavLink className="brand admin-brand" to="/admin/dashboard">
        <span className="brand-mark">U</span>
        <span className="brand-text">
          URBA TECH <span>INTER</span>
        </span>
      </NavLink>
      <nav className="admin-nav" aria-label="Admin navigation">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}>
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
