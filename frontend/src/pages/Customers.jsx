import { useEffect, useState } from "react";
import API from "../api";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [discountInputs, setDiscountInputs] = useState({});
  const [selectedCustomerPurchases, setSelectedCustomerPurchases] = useState(null);
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState(null);
  const [isAllCustomersModalOpen, setIsAllCustomersModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    birthday: "",
    preferredCategory: "",
    notes: ""
  });

  const fetchCustomers = async () => {
    try {
      const [custRes, purRes] = await Promise.all([
        API.get("/customers"),
        API.get("/purchases")
      ]);
      setCustomers(custRes.data);
      setPurchases(purRes.data);

      const initialDiscounts = {};
      custRes.data.forEach(c => {
        initialDiscounts[c._id] = c.discountPercentage || 0;
      });
      setDiscountInputs(initialDiscounts);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const updateDiscount = async (id) => {
    try {
      await API.put(`/customers/${id}`, { discountPercentage: Number(discountInputs[id]) });
      alert("Discount updated successfully!");
      fetchCustomers();
    } catch (err) {
      console.error(err);
      alert("Failed to update discount");
    }
  };

  const enrichedCustomers = customers.map(c => {
    const customerPurchases = purchases.filter(p => p.customer?._id === c._id);
    const totalSpent = customerPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
    return { ...c, totalSpent, customerPurchases };
  }).sort((a, b) => b.totalSpent - a.totalSpent);

  const addCustomer = async (e) => {
    e.preventDefault();

    await API.post("/customers", form);

    setForm({
      name: "",
      phone: "",
      email: "",
      address: "",
      birthday: "",
      preferredCategory: "",
      notes: ""
    });

    fetchCustomers();
  };

  const deleteCustomer = async (id) => {
    await API.delete(`/customers/${id}`);
    fetchCustomers();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Customers</h1>
        <button 
          onClick={() => setIsAllCustomersModalOpen(true)}
          style={{ padding: "8px 16px", background: "#8b2f4d", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", whiteSpace: "nowrap" }}
        >
          See All Customer History
        </button>
      </div>

      <form className="form" onSubmit={addCustomer} style={{ background: "linear-gradient(to right, #8b2f4d, #351c2a)", color: "white", borderRadius: "10px", padding: "25px", border: "none", boxShadow: "0 10px 20px rgba(139, 47, 77, 0.3)" }}>
        <input name="name" placeholder="Customer Name" value={form.name} onChange={handleChange} required />
        <input name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} required />
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
        <input name="address" placeholder="Address" value={form.address} onChange={handleChange} />
        <input name="birthday" type="date" value={form.birthday} onChange={handleChange} />
        <input name="preferredCategory" placeholder="Preferred Category" value={form.preferredCategory} onChange={handleChange} />
        <input name="notes" placeholder="Notes" value={form.notes} onChange={handleChange} />

        <button type="submit" style={{ background: "#d9a441", color: "#351c2a", fontWeight: "bold" }}>Add Customer</button>
      </form>

      <h2 style={{ marginTop: "40px", marginBottom: "20px" }}>Top 3 Customers</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Total Spent</th>
            <th>Discount %</th>
            <th>Purchases</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {enrichedCustomers.slice(0, 3).map((customer, index) => (
            <tr key={customer._id}>
              <td>
                {customer.name} {index === 0 && customer.totalSpent > 0 && <span title="Top Spender"> 🏆</span>}
              </td>
              <td>{customer.phone}</td>
              <td>₹{customer.totalSpent}</td>
              <td>
                <div style={{ display: "flex", gap: "5px" }}>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={discountInputs[customer._id] ?? 0} 
                    onChange={(e) => setDiscountInputs({...discountInputs, [customer._id]: e.target.value})}
                    style={{ width: "60px", padding: "5px" }}
                  />
                  <button onClick={() => updateDiscount(customer._id)} style={{ padding: "5px 10px", width: "auto" }}>Save</button>
                </div>
              </td>
              <td>
                <button style={{ padding: "5px 10px", width: "auto" }} onClick={() => setSelectedCustomerPurchases({ name: customer.name, purchases: customer.customerPurchases })}>
                  View ({customer.customerPurchases.length})
                </button>
              </td>
              <td>
                <button className="deleteBtn" onClick={() => deleteCustomer(customer._id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedCustomerPurchases && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "30px", borderRadius: "10px", maxWidth: "600px", width: "100%", maxHeight: "80vh", overflowY: "auto" }}>
            <h2 style={{ marginTop: 0 }}>{selectedCustomerPurchases.name}'s Purchases</h2>
            {selectedCustomerPurchases.purchases.length === 0 ? (
              <p>No purchases found.</p>
            ) : (
              <table style={{ width: "100%", marginTop: "15px" }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCustomerPurchases.purchases.map(p => (
                    <tr key={p._id}>
                      <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td>{p.product?.name || "Unknown"}</td>
                      <td>{p.quantity}</td>
                      <td>₹{p.totalAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button style={{ marginTop: "20px", width: "100%" }} onClick={() => setSelectedCustomerPurchases(null)}>Close</button>
          </div>
        </div>
      )}

      {isAllCustomersModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "30px", borderRadius: "10px", width: "90%", maxWidth: "1000px", maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0 }}>All Customers</h2>
              <button 
                onClick={() => setIsAllCustomersModalOpen(false)}
                style={{ background: "transparent", border: "none", fontSize: "20px", cursor: "pointer", color: "#333" }}
              >
                ✖
              </button>
            </div>
            
            <div style={{ overflowX: "auto", overflowY: "auto", flex: 1 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 1, background: "white" }}>
                  <tr>
                    <th style={{ background: "#f1d6de", padding: "12px", textAlign: "left" }}>Registration Date</th>
                    <th style={{ background: "#f1d6de", padding: "12px", textAlign: "left" }}>Name</th>
                    <th style={{ background: "#f1d6de", padding: "12px", textAlign: "left" }}>Phone</th>
                    <th style={{ background: "#f1d6de", padding: "12px", textAlign: "left" }}>Total Spent</th>
                    <th style={{ background: "#f1d6de", padding: "12px", textAlign: "left" }}>Discount %</th>
                    <th style={{ background: "#f1d6de", padding: "12px", textAlign: "left" }}>Purchases</th>
                    <th style={{ background: "#f1d6de", padding: "12px", textAlign: "left" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[...enrichedCustomers]
                    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
                    .map((customer, index) => (
                    <tr key={customer._id} style={{ borderBottom: "1px solid #efdce3" }}>
                      <td style={{ padding: "12px" }}>
                        {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : "N/A"}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span 
                          style={{ color: "#8b2f4d", cursor: "pointer", fontWeight: "bold", textDecoration: "underline" }}
                          onClick={() => setSelectedCustomerDetails(customer)}
                        >
                          {customer.name}
                        </span> 
                        {customer._id === enrichedCustomers[0]?._id && customer.totalSpent > 0 && <span title="Top Spender"> 🏆</span>}
                      </td>
                      <td style={{ padding: "12px" }}>{customer.phone}</td>
                      <td style={{ padding: "12px" }}>₹{customer.totalSpent}</td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", gap: "5px" }}>
                          <input 
                            type="number" 
                            min="0"
                            max="100"
                            value={discountInputs[customer._id] ?? 0} 
                            onChange={(e) => setDiscountInputs({...discountInputs, [customer._id]: e.target.value})}
                            style={{ width: "60px", padding: "5px" }}
                          />
                          <button onClick={() => updateDiscount(customer._id)} style={{ padding: "5px 10px", width: "auto" }}>Save</button>
                        </div>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <button style={{ padding: "5px 10px", width: "auto" }} onClick={() => {
                          setSelectedCustomerPurchases({ name: customer.name, purchases: customer.customerPurchases });
                        }}>
                          View ({customer.customerPurchases.length})
                        </button>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <button className="deleteBtn" onClick={() => deleteCustomer(customer._id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {enrichedCustomers.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ padding: "20px", textAlign: "center" }}>No customers found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <button 
              onClick={() => setIsAllCustomersModalOpen(false)}
              style={{ padding: "10px", background: "#8b2f4d", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", marginTop: "20px" }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {selectedCustomerDetails && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "30px", borderRadius: "10px", maxWidth: "500px", width: "100%", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #8b2f4d", paddingBottom: "10px", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, color: "#351c2a" }}>Customer Details</h2>
              <button 
                onClick={() => setSelectedCustomerDetails(null)}
                style={{ background: "transparent", border: "none", fontSize: "20px", cursor: "pointer", color: "#333" }}
              >
                ✖
              </button>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "15px", fontSize: "16px" }}>
              <strong style={{ color: "#5c2538" }}>Name:</strong> <div>{selectedCustomerDetails.name}</div>
              <strong style={{ color: "#5c2538" }}>Phone:</strong> <div>{selectedCustomerDetails.phone || "N/A"}</div>
              <strong style={{ color: "#5c2538" }}>Email:</strong> <div>{selectedCustomerDetails.email || "N/A"}</div>
              <strong style={{ color: "#5c2538" }}>Address:</strong> <div>{selectedCustomerDetails.address || "N/A"}</div>
              <strong style={{ color: "#5c2538" }}>Birthday:</strong> <div>{selectedCustomerDetails.birthday ? new Date(selectedCustomerDetails.birthday).toLocaleDateString() : "N/A"}</div>
              <strong style={{ color: "#5c2538" }}>Pref. Category:</strong> <div>{selectedCustomerDetails.preferredCategory || "N/A"}</div>
              <strong style={{ color: "#5c2538" }}>Notes:</strong> <div>{selectedCustomerDetails.notes || "None"}</div>
              <strong style={{ color: "#5c2538" }}>Registered:</strong> <div>{selectedCustomerDetails.createdAt ? new Date(selectedCustomerDetails.createdAt).toLocaleDateString() : "N/A"}</div>
            </div>

            <button style={{ marginTop: "30px", width: "100%", padding: "12px", background: "#8b2f4d", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", cursor: "pointer", fontWeight: "bold" }} onClick={() => setSelectedCustomerDetails(null)}>Close Details</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;