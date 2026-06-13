import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import API from "../api";
import { format } from "date-fns";

function Purchases() {
  const { user } = useContext(AuthContext);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  const location = useLocation();
  const preSelectedProductId = location.state?.productId || "";

  const [form, setForm] = useState({
    customer: "",
    product: preSelectedProductId,
    quantity: "1",
    paymentMethod: "Cash"
  });

  const fetchData = async () => {
    try {
      const productRes = await API.get("/products");
      const purchaseRes = await API.get("/purchases");
      setProducts(productRes.data);
      setPurchases(purchaseRes.data);

      if (user?.role === "admin") {
        const customerRes = await API.get("/customers");
        setCustomers(customerRes.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const selectedProduct = products.find((product) => product._id === form.product);
  const selectedCustomerDetails = customers.find((c) => c._id === form.customer);
  const discountPercentage = selectedCustomerDetails?.discountPercentage || 0;

  const subTotal = selectedProduct
    ? selectedProduct.price * Number(form.quantity || 0)
    : 0;

  const discountAmount = (subTotal * discountPercentage) / 100;
  const totalAmount = subTotal - discountAmount;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addPurchase = async (e) => {
    e.preventDefault();

    if (!form.product) {
      alert("Please select a product!");
      return;
    }

    if (user?.role === "admin" && !form.customer) {
      alert("Please select a customer!");
      return;
    }

    try {
      await API.post("/purchases", {
        ...form,
        quantity: Number(form.quantity),
        totalAmount,
        discount: discountAmount
      });

      setForm({
        customer: "",
        product: preSelectedProductId,
        quantity: "1",
        paymentMethod: "Cash"
      });

      alert("Purchase added successfully!");
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to add purchase");
    }
  };

  const productSalesCount = {};
  purchases.forEach((p) => {
    const prodName = p.product?.name || "Unknown Product";
    productSalesCount[prodName] = (productSalesCount[prodName] || 0) + p.quantity;
  });

  const top3Products = Object.entries(productSalesCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div>
      <h1>Purchases</h1>

      <form className="form" onSubmit={addPurchase} style={{ background: "linear-gradient(to right, #8b2f4d, #351c2a)", color: "white", borderRadius: "10px", padding: "25px", border: "none", boxShadow: "0 10px 20px rgba(139, 47, 77, 0.3)" }}>
        {user?.role === "admin" && (
          <select name="customer" value={form.customer} onChange={handleChange} required>
            <option value="">Select Customer</option>
            {customers.map((customer) => (
              <option key={customer._id} value={customer._id}>
                {customer.name}
              </option>
            ))}
          </select>
        )}

        {preSelectedProductId ? (
          <div style={{ marginBottom: "15px", padding: "14px", background: "#f7f2ef", border: "1px solid #d8b6c3", borderRadius: "7px" }}>
            <strong>Purchasing:</strong> {selectedProduct?.name} - ₹{selectedProduct?.price}
          </div>
        ) : (
          <select name="product" value={form.product} onChange={handleChange} required>
            <option value="">Select Product</option>
            {products.map((product) => (
              <option key={product._id} value={product._id} disabled={product.stock <= 0}>
                {product.name} - ₹{product.price} {product.stock <= 0 ? "(Out of Stock)" : ""}
              </option>
            ))}
          </select>
        )}

        <input
          name="quantity"
          type="number"
          placeholder="Quantity"
          min="1"
          value={form.quantity}
          onChange={handleChange}
          required
        />

        <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange} required>
          <option value="">Payment Method</option>
          <option value="Cash">Cash</option>
          <option value="UPI">UPI</option>
          <option value="Card">Card</option>
        </select>

        {discountPercentage > 0 && (
          <div style={{ padding: "10px", background: "#e8f5e9", color: "#2e7d32", borderRadius: "5px", marginBottom: "10px" }}>
            🌟 VIP Discount Applied: {discountPercentage}% (Saved ₹{discountAmount})
          </div>
        )}

        <h3 style={{ color: "white" }}>Total: ₹{totalAmount} <span style={{ fontSize: "14px", fontWeight: "normal", color: "#dec9d3" }}>{discountPercentage > 0 ? `(Subtotal: ₹${subTotal})` : ""}</span></h3>

        <button type="submit" style={{ background: "#d9a441", color: "#351c2a", fontWeight: "bold" }}>{user?.role === "admin" ? "Add Purchase" : "Confirm Purchase"}</button>
      </form>

      {user?.role === "admin" && top3Products.length > 0 && (
        <div style={{ marginTop: "30px", padding: "20px", background: "white", borderRadius: "10px", border: "1px solid #ead3dc", boxShadow: "0 10px 24px rgba(53, 28, 42, 0.06)" }}>
          <h2 style={{ marginTop: 0, color: "#351c2a" }}>Top 3 Best Sellers 🏆</h2>
          <div style={{ display: "flex", gap: "20px", marginTop: "15px" }}>
            {top3Products.map((item, index) => (
              <div key={index} style={{ flex: 1, padding: "15px", background: "#f7f2ef", borderRadius: "8px", borderLeft: `5px solid ${['#d9a441', '#8b2f4d', '#415a77'][index]}` }}>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#351c2a" }}>#{index + 1}</div>
                <div style={{ fontSize: "18px", fontWeight: "bold", marginTop: "5px" }}>{item[0]}</div>
                <div style={{ color: "#666", marginTop: "5px" }}>{item[1]} units sold</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: "40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>{user?.role === "admin" ? "All Purchases" : "My Purchases"}</h2>
        <button 
          onClick={() => setIsPurchaseModalOpen(true)}
          style={{ padding: "8px 16px", background: "#8b2f4d", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", whiteSpace: "nowrap" }}
        >
          {user?.role === "admin" ? "See All Purchase Details" : "See My Purchase Details"}
        </button>
      </div>

      {isPurchaseModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "30px", borderRadius: "10px", width: "90%", maxWidth: "1000px", maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0 }}>{user?.role === "admin" ? "All Purchase Details" : "My Purchase Details"}</h2>
              <button 
                onClick={() => setIsPurchaseModalOpen(false)}
                style={{ background: "transparent", border: "none", fontSize: "20px", cursor: "pointer", color: "#333" }}
              >
                ✖
              </button>
            </div>
            
            <div style={{ overflowX: "auto", overflowY: "auto", flex: 1 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: user?.role === "admin" ? "800px" : "500px" }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                  <tr>
                    <th style={{ background: "#f1d6de", padding: "12px", textAlign: "left" }}>Date</th>
                    {user?.role === "admin" && (
                      <>
                        <th style={{ background: "#f1d6de", padding: "12px", textAlign: "left" }}>Customer Name</th>
                        <th style={{ background: "#f1d6de", padding: "12px", textAlign: "left" }}>Customer ID</th>
                        <th style={{ background: "#f1d6de", padding: "12px", textAlign: "left" }}>Email ID</th>
                      </>
                    )}
                    <th style={{ background: "#f1d6de", padding: "12px", textAlign: "left" }}>Product</th>
                    <th style={{ background: "#f1d6de", padding: "12px", textAlign: "left" }}>Qty</th>
                    <th style={{ background: "#f1d6de", padding: "12px", textAlign: "left" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map(p => (
                    <tr key={p._id} style={{ borderBottom: "1px solid #efdce3" }}>
                      <td style={{ padding: "12px" }}>{format(new Date(p.purchaseDate || p.createdAt), "MMM dd, yyyy")}</td>
                      {user?.role === "admin" && (
                        <>
                          <td style={{ padding: "12px" }}>{p.customer?.name || "Unknown"}</td>
                          <td style={{ padding: "12px", fontSize: "13px", color: "#666" }}>{p.customer?._id || "N/A"}</td>
                          <td style={{ padding: "12px", fontSize: "13px", color: "#666" }}>{p.customer?.email || "N/A"}</td>
                        </>
                      )}
                      <td style={{ padding: "12px" }}>{p.product?.name || "Unknown"}</td>
                      <td style={{ padding: "12px" }}>{p.quantity}</td>
                      <td style={{ padding: "12px", fontWeight: "bold" }}>₹{p.totalAmount}</td>
                    </tr>
                  ))}
                  {purchases.length === 0 && (
                    <tr>
                      <td colSpan={user?.role === "admin" ? "7" : "4"} style={{ padding: "20px", textAlign: "center" }}>No purchases found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <button 
              onClick={() => setIsPurchaseModalOpen(false)}
              style={{ padding: "10px", background: "#8b2f4d", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", marginTop: "20px" }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Purchases;