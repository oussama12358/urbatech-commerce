import { Link, useLocation } from "react-router-dom";
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Twitter } from "lucide-react";
import { useStore } from "../../store/StoreContext.jsx";

export default function Footer() {
  const { settings, user } = useStore();
  const location = useLocation();
  const isStorePage = location.pathname === "/store";
  const mapUrl = "https://maps.app.goo.gl/EfcvXuoFrpedKs9m7";
  const phoneNumber = "+216 20 731 931";
  const whatsappUrl = "https://wa.me/21620731931";
  const contactEmail = "contact@urbatechinter.com";
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contactEmail)}`;

  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-col brand-col">
          <div className="brand-footer">
            <span className="brand-mark">U</span>
            <div>
              <strong>URBA TECH</strong>
              <p>INTER</p>
            </div>
          </div>

          <a className="footer-address" href={mapUrl} target="_blank" rel="noreferrer">
            <MapPin />
            <span>05, Ain Berda 7000 Bizerte North — Tunisia</span>
          </a>

          <div className="social-links" aria-label="Social links">
            <button type="button" aria-label="Twitter"><Twitter /></button>
            <button type="button" aria-label="LinkedIn"><Linkedin /></button>
            <button type="button" aria-label="Facebook"><Facebook /></button>
            <button type="button" aria-label="Instagram"><Instagram /></button>
          </div>
        </div>

        <div className="footer-col">
          <h3>Quick Links</h3>
          <nav className="footer-list">
            {
              (() => {
                const path = location.pathname || "";
                const links = [];

                // Store/product related pages
                if (path.startsWith("/store") || path.startsWith("/product")) {
                  if (settings.storefrontEnabled) links.push({ to: "/store", label: "Store" });
                  if (settings.storefrontEnabled) links.push({ to: "/cart", label: "Cart" });
                  if (user) links.push({ to: "/orders", label: "Orders" });
                  if (user) links.push({ to: "/account", label: "Account" });
                } else if (path.startsWith("/cart") || path.startsWith("/checkout")) {
                  if (settings.storefrontEnabled) links.push({ to: "/cart", label: "Cart" });
                  if (settings.storefrontEnabled) links.push({ to: "/store", label: "Store" });
                  if (user) links.push({ to: "/orders", label: "Orders" });
                  if (user) links.push({ to: "/account", label: "Account" });
                } else if (path.startsWith("/account") || path.startsWith("/orders")) {
                  if (settings.storefrontEnabled) links.push({ to: "/store", label: "Store" });
                  if (settings.storefrontEnabled) links.push({ to: "/cart", label: "Cart" });
                  links.push({ to: "/account", label: "Account" });
                  links.push({ to: "/orders", label: "Orders" });
                } else {
                  // Default: show store + account/login depending on auth
                  if (settings.storefrontEnabled) links.push({ to: "/store", label: "Store" });
                  if (settings.storefrontEnabled) links.push({ to: "/cart", label: "Cart" });
                }

                // Render links
                return (
                  <>
                    {links.map((l) => (
                      <Link key={l.to} to={l.to}>{l.label}</Link>
                    ))}
                    {path.startsWith("/account") || path.startsWith("/orders") ? (
                      user ? <Link to="/logout">Logout</Link> : <Link to="/login">Login</Link>
                    ) : null}
                    {/* For non-account pages, always show auth link at end */}
                    {!path.startsWith("/account") && !path.startsWith("/orders") && (
                      user ? <Link to="/logout">Logout</Link> : <Link to="/login">Login</Link>
                    )}
                  </>
                );
              })()
            }
          </nav>
        </div>

        <div className="footer-col">
          <h3>Services</h3>
          <ul className="footer-list">
            <li>Urban Planning Management</li>
            <li>Construction Engineering</li>
            <li>Spatial Infrastructure</li>
            <li>Marketing Design</li>
            <li>Training &amp; Tutorials</li>
          </ul>
        </div>

        <div className="footer-col">
          <h3>Contact</h3>
          <div className="footer-contact">
            <a className="footer-contact-row" href={mapUrl} target="_blank" rel="noreferrer">
              <MapPin />
              <span>05, Ain Berda 7000 Bizerte North — Tunisia</span>
            </a>
            <p>
              <Phone />
              <a href={whatsappUrl} target="_blank" rel="noreferrer">{phoneNumber}</a>
            </p>
            <p>
              <Mail />
              <a href={gmailUrl} target="_blank" rel="noreferrer">{contactEmail}</a>
            </p>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        © 2026 URBA TECH INTER. All rights reserved. International Engineering &amp; Tutorial Consulting.
      </div>
    </footer>
  );
}
