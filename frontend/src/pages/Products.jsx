import { useEffect, useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import API from "../api";

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    size: "",
    color: "",
    imageUrl: ""
  });

  const fetchProducts = async () => {
    try {
      const res = await API.get("/products");
      setProducts(res.data);
      
      const uniqueCategories = [...new Set(res.data.map(item => item.category))];
      setCategories(uniqueCategories);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addProduct = async (e) => {
    e.preventDefault();
    if (user?.role !== "admin") return;

    await API.post("/products", {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock)
    });

    setForm({
      name: "",
      category: "",
      price: "",
      stock: "",
      size: "",
      color: "",
      imageUrl: ""
    });

    fetchProducts();
  };

  const deleteProduct = async (id) => {
    if (user?.role !== "admin") return;
    await API.delete(`/products/${id}`);
    fetchProducts();
  };

  const handleAddToCart = (product) => {
    if (!user) {
      navigate("/login", { state: { from: location } });
      return;
    }
    addToCart(product);
  };

  const filteredProducts = selectedCategory 
    ? products.filter(p => p.category === selectedCategory) 
    : products;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Storefront</h1>
        <div className="category-filter">
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((cat, index) => (
              <option key={index} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {user?.role === "admin" && (
        <form className="form" onSubmit={addProduct} style={{ background: "linear-gradient(to right, #8b2f4d, #351c2a)", color: "white", borderRadius: "10px", padding: "25px", border: "none", boxShadow: "0 10px 20px rgba(139, 47, 77, 0.3)" }}>
          <input name="name" placeholder="Product Name" value={form.name} onChange={handleChange} required />
          <input name="category" placeholder="Category" value={form.category} onChange={handleChange} required />
          <input name="price" type="number" placeholder="Price" value={form.price} onChange={handleChange} required />
          <input name="stock" type="number" placeholder="Stock" value={form.stock} onChange={handleChange} />
          <input name="imageUrl" placeholder="Image URL (optional)" value={form.imageUrl} onChange={handleChange} />
          <button type="submit" style={{ background: "#d9a441", color: "#351c2a", fontWeight: "bold" }}>Add Product</button>
        </form>
      )}

      <div className="product-grid">
        {filteredProducts.map((product) => (
          <div className="product-card" key={product._id}>
            <img src={product.imageUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80"} alt={product.name} className="product-image" />
            <div className="product-info">
              <span className="product-category">{product.category}</span>
              <h3 className="product-title">{product.name}</h3>
              <div className="product-price">₹{product.price}</div>
              
              <div className="product-actions">
                {(!user || user.role !== "admin") && (
                  <button 
                    style={{ background: "#d9a441", color: "#351c2a" }}
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock <= 0}
                  >
                    {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                  </button>
                )}
                {user?.role === "admin" && (
                  <button className="deleteBtn" onClick={() => deleteProduct(product._id)}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filteredProducts.length === 0 && (
          <p>No products found in this category.</p>
        )}
      </div>
    </div>
  );
}

export default Products;