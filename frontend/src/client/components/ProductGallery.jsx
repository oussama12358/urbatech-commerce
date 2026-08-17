import { useEffect, useMemo, useState } from "react";
import ProductArt from "./ProductArt.jsx";

export default function ProductGallery({ product }) {
  const images = useMemo(
    () => (Array.isArray(product?.images) ? product.images.filter(Boolean).slice(0, 8) : []),
    [product?.images]
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [product?.id]);

  if (!images.length) return <ProductArt product={product} />;

  const activeImage = images[Math.min(activeIndex, images.length - 1)];
  const selectPrevious = () => setActiveIndex((current) => (current - 1 + images.length) % images.length);
  const selectNext = () => setActiveIndex((current) => (current + 1) % images.length);

  return (
    <div className="product-gallery">
      <div className="product-gallery-main">
        <img src={activeImage} alt={`${product.name || "Product"} — ${activeIndex + 1}`} />
        {images.length > 1 && (
          <>
            <button className="gallery-nav gallery-nav-prev" type="button" onClick={selectPrevious} aria-label="Previous product image">‹</button>
            <button className="gallery-nav gallery-nav-next" type="button" onClick={selectNext} aria-label="Next product image">›</button>
            <span className="gallery-count" aria-live="polite">{activeIndex + 1} / {images.length}</span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="product-gallery-thumbnails" aria-label="Product images">
          {images.map((image, index) => (
            <button
              key={`${image.slice(0, 48)}-${index}`}
              className={`product-gallery-thumbnail ${index === activeIndex ? "active" : ""}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show product image ${index + 1}`}
              aria-current={index === activeIndex ? "true" : undefined}
            >
              <img src={image} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
