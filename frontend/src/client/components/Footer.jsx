import { Link, useLocation } from "react-router-dom";
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Twitter } from "lucide-react";
import { useStore } from "../../store/StoreContext.jsx";
import { t, useLocale } from "../../i18n.js";

export default function Footer() {
  useLocale();
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
            <span className="brand-mark">UTI</span>
            <div>
              <strong>URBA TECH</strong>
              <p>INTER</p>
            </div>
          </div>

          <a className="footer-address" href={mapUrl} target="_blank" rel="noreferrer">
            <MapPin />
            <span>{t("footerAddress")}</span>
          </a>

          <div className="social-links" aria-label="Social links">
            <button type="button" aria-label="Twitter"><Twitter /></button>
            <button type="button" aria-label="LinkedIn"><Linkedin /></button>
            <button type="button" aria-label="Facebook"><Facebook /></button>
            <button type="button" aria-label="Instagram"><Instagram /></button>
          </div>
        </div>

        <div className="footer-col">
          <h3>{t("footerQuickLinks")}</h3>
          <nav className="footer-list">
            {
              (() => {
                const path = location.pathname || "";
                const links = [];

                // Store/product related pages
                if (path.startsWith("/store") || path.startsWith("/product")) {
                  if (settings.storefrontEnabled) links.push({ to: "/store", label: t("store") });
                  if (settings.storefrontEnabled) links.push({ to: "/cart", label: t("cart") });
                  if (user) links.push({ to: "/orders", label: t("orders") });
                  if (user) links.push({ to: "/account", label: t("account") });
                } else if (path.startsWith("/cart") || path.startsWith("/checkout")) {
                  if (settings.storefrontEnabled) links.push({ to: "/cart", label: t("cart") });
                  if (settings.storefrontEnabled) links.push({ to: "/store", label: t("store") });
                  if (user) links.push({ to: "/orders", label: t("orders") });
                  if (user) links.push({ to: "/account", label: t("account") });
                } else if (path.startsWith("/account") || path.startsWith("/orders")) {
                  if (settings.storefrontEnabled) links.push({ to: "/store", label: t("store") });
                  if (settings.storefrontEnabled) links.push({ to: "/cart", label: t("cart") });
                  links.push({ to: "/account", label: t("account") });
                  links.push({ to: "/orders", label: t("orders") });
                } else {
                  // Default: show store + account/login depending on auth
                  if (settings.storefrontEnabled) links.push({ to: "/store", label: t("store") });
                  if (settings.storefrontEnabled) links.push({ to: "/cart", label: t("cart") });
                }

                // Render links
                return (
                  <>
                    {links.map((l) => (
                      <Link key={l.to} to={l.to}>{l.label}</Link>
                    ))}
                    {path.startsWith("/account") || path.startsWith("/orders") ? (
                      user ? <Link to="/logout">{t("logout")}</Link> : <Link to="/login">{t("login")}</Link>
                    ) : null}
                    {/* For non-account pages, always show auth link at end */}
                    {!path.startsWith("/account") && !path.startsWith("/orders") && (
                      user ? <Link to="/logout">{t("logout")}</Link> : <Link to="/login">{t("login")}</Link>
                    )}
                  </>
                );
              })()
            }
          </nav>
        </div>

        <div className="footer-col">
          <h3>{t("footerServices")}</h3>
          <ul className="footer-list">
            <li>{t("servicesUrbanPlanning")}</li>
            <li>{t("servicesConstruction")}</li>
            <li>{t("servicesInfrastructure")}</li>
            <li>{t("servicesMarketing")}</li>
            <li>{t("servicesTraining")}</li>
          </ul>
        </div>

        <div className="footer-col">
          <h3>{t("footerContact")}</h3>
          <div className="footer-contact">
            <a className="footer-contact-row" href={mapUrl} target="_blank" rel="noreferrer">
              <MapPin />
              <span>{t("footerAddress")}</span>
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
        {t("footerCopyright")}
      </div>
    </footer>
  );
}
