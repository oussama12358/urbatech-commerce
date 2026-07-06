import { Link } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { money } from "../../shared/lib/format.js";

export default function ProductTable({ products, onDelete }) {
  if (!products.length) {
    return <div className="empty">No products yet.</div>;
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Product</th>
          <th>Supplier ID</th>
          <th>Category</th>
          <th>Price</th>
          <th>Cost</th>
          <th>Stock</th>
          <th>Margin</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => (
          <tr key={product.id}>
            <td>{product.name}</td>
            <td>{product.supplier_product_id || "-"}</td>
            <td>{product.category}</td>
            <td>{money(product.price)}</td>
            <td>{money(product.cost_price || 0)}</td>
            <td>{product.stock}</td>
            <td>{product.margin}%</td>
            <td>
              <div className="row-actions">
                <Link className="icon-btn" to={`/admin/products/${product.id}/edit`} aria-label={`Edit ${product.name}`}>
                  <Pencil />
                </Link>
                {onDelete && (
                  <button
                    className="icon-btn danger-icon"
                    type="button"
                    title={`Delete ${product.name}`}
                    aria-label={`Delete ${product.name}`}
                    onClick={() => onDelete(product)}
                  >
                    <Trash2 />
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
