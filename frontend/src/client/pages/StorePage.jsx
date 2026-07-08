import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Hero from "../components/Hero.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { useStore } from "../../store/StoreContext.jsx";
import { money } from "../../shared/lib/format.js";
import { t } from "../../i18n.js";

export default function StorePage() {
  const { products } = useStore();
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("featured");
  const [maxPrice, setMaxPrice] = useState(6500);
  const categories = useMemo(() => ["All", ...new Set(products.map((item) => item.category))], [products]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const list = products.filter((product) => {
      const matchesCategory = category === "All" || product.category === category;
      const matchesPrice = product.price <= maxPrice;
      const text = [product.name, product.category, product.desc, product.specs.join(" ")].join(" ").toLowerCase();
      return matchesCategory && matchesPrice && text.includes(q);
    });
    if (sort === "priceAsc") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "priceDesc") return [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [category, maxPrice, products, query, sort]);

  return (
    <main className="main">
      <Hero
        eyebrow="Smart infrastructure store"
        title="Professional equipment for smart city and infrastructure projects"
        lead="Independent e-commerce website for URBA TECH INTER: Secure online ordering for professional smart city equipment, fast checkout, and reliable delivery."
        stats={[
          { value: String(products.length), label: t('products') },
          { value: String(Math.max(0, categories.length - 1)), label: t('categories') }
        ]}
      />

      <section className="toolbar">
        <input className="input" type="search" placeholder="Search products, specs, category..." value={query} onChange={(event) => setQuery(event.target.value)} />
        <select className="select" value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="featured">Featured</option>
          <option value="priceAsc">Price: low to high</option>
          <option value="priceDesc">Price: high to low</option>
        </select>
      </section>

      <section className="layout">
        <aside className="filters">
          <h2 className="section-title">Categories</h2>
          <div className="filter-list">
            {categories.map((item) => (
              <button className={`filter-chip ${category === item ? "active" : ""}`} key={item} onClick={() => setCategory(item)}>
                <span>{item}</span>
                <span>{item === "All" ? products.length : products.filter((product) => product.category === item).length}</span>
              </button>
            ))}
          </div>
          <h2 className="section-title">Maximum price</h2>
          <div className="range-row">
            <input type="range" min="300" max="6500" step="100" value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} />
            <strong>{money(maxPrice)}</strong>
          </div>
        </aside>

        <section>
          <div className="products-head">
            <span>{filtered.length} products</span>
          </div>
          <div className="product-grid">
            {filtered.map((product) => (
              <ProductCard product={product} key={product.id} />
            ))}
            {!filtered.length && <div className="empty">No products match these filters.</div>}
          </div>
        </section>
      </section>
    </main>
  );
}
