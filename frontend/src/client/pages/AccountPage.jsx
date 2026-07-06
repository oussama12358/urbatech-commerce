import { Link } from "react-router-dom";
import Hero from "../components/Hero.jsx";
import { useStore } from "../../store/StoreContext.jsx";

export default function AccountPage() {
  const { user } = useStore();

  return (
    <main className="main">
      <Hero
        eyebrow="Account"
        title="Account overview"
        lead="Manage your profile and account settings."
      />

      <section className="panel account-panel">
        <div className="kv">
          <div className="kv-row"><span>Name</span><strong>{user?.name || "-"}</strong></div>
          <div className="kv-row"><span>Email</span><strong>{user?.email || "-"}</strong></div>
        </div>
        <div className="panel-actions" style={{ marginTop: 16 }}>
          <Link className="secondary-btn" to="/logout">Logout</Link>
        </div>
      </section>
    </main>
  );
}
