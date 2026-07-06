import { Link } from "react-router-dom";
import Hero from "../components/Hero.jsx";

export default function ContactPage() {
  const contactEmail = "contact@urbatechinter.com";
  const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contactEmail)}`;
  const whatsappNumber = "+216 20 731 931";
  const whatsappLink = "https://wa.me/21620731931";

  return (
    <main className="main">
      <Hero
        eyebrow="Support"
        title="Need help with your checkout?"
        lead="Our team is here to help with payment, delivery, and account questions."
      />
      <section className="panel">
        <h2>Contact support</h2>
        <p className="desc">
          Have a question about your order or payment? Reach out and we’ll respond as quickly as possible.
        </p>
        <div className="support-badge-row">
          <span className="support-badge">Live support available</span>
        </div>
        <div className="contact-cards">
          <div className="contact-card">
            <div>
              <span>Email</span>
              <strong>
                <a href={gmailLink} target="_blank" rel="noreferrer" className="contact-link link-button">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                  {contactEmail}
                </a>
              </strong>
            </div>
          </div>
          <div className="contact-card">
            <div>
              <span>WhatsApp</span>
              <strong>
                <a href={whatsappLink} target="_blank" rel="noreferrer" className="contact-link link-button">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                    <path d="M16.5 11.5c-.2-.1-1.2-.7-1.4-.8-.2-.1-.4-.1-.6.1-.2.2-.8.8-1 1 .1.1-.1.1-.2.1-.1 0-.2 0-.3-.1-.1-.2-.6-.7-.8-.8-.2-.1-.4-.1-.6 0-.2.1-.7.5-.8.6-.1.2-.4.4-.4.8 0 .4.3 1.1.4 1.2.1.1.8 1.2 2 1.7.3.1.5.2.8.1.2 0 1.2-.5 1.4-.6.2-.1.4-.2.5-.4.1-.2.1-.4 0-.6-.1-.2-.5-.8-.7-1z" fill="#fff"/>
                    <path fill="currentColor" d="M12 2C6.5 2 2 6.4 2 11.8c0 2.1.7 4.1 1.8 5.7L2 22l4.8-1.5c1.5 1 3.3 1.5 5.2 1.5 5.5 0 10-4.4 10-9.8S17.5 2 12 2z" opacity=".25"/>
                  </svg>
                  {whatsappNumber}
                </a>
              </strong>
            </div>
          </div>
        </div>
        <div className="panel-note">
          <p>If you need faster support, include your order number and checkout details in the message.</p>
        </div>
        <Link to="/checkout" className="secondary-btn" style={{ display: "inline-flex", marginTop: "16px" }}>
          Back to checkout
        </Link>
      </section>
    </main>
  );
}
