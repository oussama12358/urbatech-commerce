export default function ProductArt({ product }) {
  return (
    <div className="product-art" style={{ "--accent": product.accent }}>
      <div className={`device ${product.type}`} />
    </div>
  );
}
