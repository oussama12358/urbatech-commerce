import { useNavigate, useParams } from "react-router-dom";
import { Check, FileText, ShoppingCart } from "lucide-react";
import ProductArt from "../components/ProductArt.jsx";
import { useStore } from "../../store/StoreContext.jsx";
import { money } from "../../shared/lib/format.js";

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, addToCart, cart } = useStore();
  const product = products.find((item) => item.id === id);
  const isInCart = Boolean(product && cart[product.id]);

  if (!product) {
    return (
      <main className="main">
        <div className="empty">Product not found.</div>
      </main>
    );
  }

  return (
    <main className="main">
      <section className="detail-grid">
        <div className="detail-media">
          <ProductArt product={product} />
          <span className="badge">{product.status}</span>
        </div>
        <section className="panel">
          <div className="category">{product.category}</div>
          <h1>{product.name}</h1>
          <p className="lead">{product.desc}</p>
          <div className="kv">
            <div className="kv-row"><span>Price</span><strong>{money(product.price)}</strong></div>
            <div className="kv-row"><span>Availability</span><strong>{product.status} - {product.stock} units</strong></div>
            <div className="kv-row"><span>Lead time</span><strong>{product.lead}</strong></div>
            <div className="kv-row"><span>Warranty</span><strong>{product.warranty}</strong></div>
          </div>
          <div className="specs">
            {product.specs.map((spec) => <span className="spec" key={spec}>{spec}</span>)}
          </div>
          <div className="card-actions" style={{ marginTop: 18 }}>
            <button className="primary-btn" disabled={isInCart} onClick={() => {
              addToCart(product.id);
            }}>
              {isInCart ? <Check /> : <ShoppingCart />} {isInCart ? "In cart" : "Add to cart"}
            </button>
            <button className="secondary-btn" type="button" onClick={() => {
              if (!isInCart) {
                addToCart(product.id);
              }
              navigate("/checkout");
            }}><FileText /> Buy Now</button>
          </div>
          {isInCart && (
            <div className="notice" style={{ marginTop: 12, color: "#1c7ed6" }}>
              This product is already in your cart.
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
