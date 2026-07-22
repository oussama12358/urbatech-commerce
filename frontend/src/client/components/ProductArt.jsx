export default function ProductArt({ product }) {
  const image = product.images?.[0];
  if (image) {
    return (
      <div className="product-art has-image">
        <img src={image} alt={product.name || ""} />
      </div>
    );
  }

  return (
    <div className="product-art" style={{ "--accent": product.accent }}>
      <div className={`device ${product.type}`} />
    </div>
  );
}
