import { useEffect, useState } from "react";
import API from "../api";
import { format, startOfWeek, startOfMonth, startOfDay, startOfYear } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

function Analytics() {
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalCustomersCount, setTotalCustomersCount] = useState(0);
  
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeGranularity, setTimeGranularity] = useState("monthly"); // daily, weekly, monthly, yearly
  const [categoryTimeFilter, setCategoryTimeFilter] = useState("yearly");
  const [productTimeFilter, setProductTimeFilter] = useState("yearly");
  const [loading, setLoading] = useState(true);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  const COLORS = ['#8b2f4d', '#d9a441', '#351c2a', '#c0392b', '#2980b9', '#27ae60', '#f39c12', '#8e44ad', '#16a085', '#2c3e50', '#e74c3c', '#3498db'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [purchaseRes, productRes, customerRes] = await Promise.all([
          API.get("/purchases"),
          API.get("/products"),
          API.get("/customers")
        ]);
        
        setTotalCustomersCount(customerRes.data.length);
        
        setPurchases(purchaseRes.data);
        setProducts(productRes.data);
        
        const uniqueCategories = [...new Set(productRes.data.map(item => item.category))];
        setCategories(uniqueCategories);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <h2>Loading analytics...</h2>;

  // Filter purchases
  const filteredPurchases = purchases.filter(p => {
    const productCategory = p.product?.category || "Unknown";
    const productName = (p.product?.name || "Unknown").toLowerCase();
    const customerName = (p.customer?.name || "Unknown").toLowerCase();
    const search = searchQuery.toLowerCase();

    if (selectedCategory && productCategory !== selectedCategory) return false;
    if (search && !productName.includes(search) && !customerName.includes(search)) return false;

    return true;
  });

  // Sort chronologically for time series chart (backend returns descending usually)
  const chronologicalPurchases = [...filteredPurchases].reverse();

  // Metrics
  const totalRevenue = filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const averagePurchaseValue = filteredPurchases.length > 0 ? totalRevenue / filteredPurchases.length : 0;
  
  const customerCounts = {};
  filteredPurchases.forEach(p => {
    const cId = p.customer?._id;
    if (cId) customerCounts[cId] = (customerCounts[cId] || 0) + 1;
  });
  const repeatCustomers = Object.values(customerCounts).filter(c => c > 1).length;
  const totalUniqueCustomers = Object.keys(customerCounts).length;
  const repeatPurchaseRate = totalUniqueCustomers > 0 ? (repeatCustomers / totalUniqueCustomers) * 100 : 0;

  // Time Series Data
  const timeSeriesDataMap = {};
  chronologicalPurchases.forEach(p => {
    const date = new Date(p.purchaseDate || p.createdAt);
    let key = "";
    if (timeGranularity === "daily") {
      key = format(startOfDay(date), "MMM dd, yyyy");
    } else if (timeGranularity === "weekly") {
      key = "Wk of " + format(startOfWeek(date), "MMM dd");
    } else if (timeGranularity === "monthly") {
      key = format(startOfMonth(date), "MMM yyyy");
    } else if (timeGranularity === "yearly") {
      key = format(startOfYear(date), "yyyy");
    }
    timeSeriesDataMap[key] = (timeSeriesDataMap[key] || 0) + p.totalAmount;
  });
  const timeSeriesData = Object.entries(timeSeriesDataMap).map(([time, sales]) => ({ time, sales }));

  const filterByCurrentPeriod = (purchasesList, filterType) => {
    const now = new Date();
    return purchasesList.filter(p => {
      const date = new Date(p.purchaseDate || p.createdAt);
      if (filterType === "daily") return startOfDay(date).getTime() === startOfDay(now).getTime();
      if (filterType === "weekly") return startOfWeek(date).getTime() === startOfWeek(now).getTime();
      if (filterType === "monthly") return startOfMonth(date).getTime() === startOfMonth(now).getTime();
      if (filterType === "yearly") return startOfYear(date).getTime() === startOfYear(now).getTime();
      return true;
    });
  };

  // Best Selling Products
  const productSales = {};
  const filteredPurchasesForProducts = filterByCurrentPeriod(filteredPurchases, productTimeFilter);
  filteredPurchasesForProducts.forEach(p => {
    const pName = p.product?.name || "Unknown";
    productSales[pName] = (productSales[pName] || 0) + p.quantity;
  });
  const productData = Object.entries(productSales).map(([name, quantity]) => ({ name, quantity })).sort((a,b) => b.quantity - a.quantity).slice(0, 10);

  // Category Sales
  const categorySales = {};
  if (!selectedCategory) {
    const filteredPurchasesForCategory = filterByCurrentPeriod(filteredPurchases, categoryTimeFilter);
    filteredPurchasesForCategory.forEach(p => {
      const cName = p.product?.category || "Unknown";
      categorySales[cName] = (categorySales[cName] || 0) + p.totalAmount;
    });
  }
  const categoryData = Object.entries(categorySales).map(([name, sales]) => ({ name, sales }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
          <h1 style={{ margin: 0 }}>Advanced Analytics</h1>
          <button 
            onClick={() => setIsPurchaseModalOpen(true)}
            style={{ padding: "8px 16px", background: "#8b2f4d", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", whiteSpace: "nowrap" }}
          >
            See All Purchase Details
          </button>
        </div>
        <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
          <input 
            type="text" 
            placeholder="Search Product or Customer..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "250px", padding: "10px", borderRadius: "6px", border: "1px solid #d8b6c3" }}
          />
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ width: "180px", padding: "10px", borderRadius: "6px", border: "1px solid #d8b6c3" }}>
            <option value="">All Categories</option>
            {categories.map((cat, index) => (
              <option key={index} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="cards">
        <div className="card">
          <h3>Total Revenue</h3>
          <p>₹{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="card">
          <h3>Avg. Purchase</h3>
          <p>₹{averagePurchaseValue.toFixed(0)}</p>
        </div>
        <div className="card">
          <h3>Repeat Customers</h3>
          <p>{repeatCustomers}</p>
        </div>
        <div className="card">
          <h3>Repeat Rate</h3>
          <p>{repeatPurchaseRate.toFixed(1)}%</p>
        </div>
        {selectedCategory && (
          <>
            <div className="card">
              <h3>Unique Buyers</h3>
              <p>{totalUniqueCustomers}</p>
            </div>
            <div className="card">
              <h3>Buyer %</h3>
              <p>{totalCustomersCount > 0 ? ((totalUniqueCustomers / totalCustomersCount) * 100).toFixed(1) : 0}%</p>
            </div>
          </>
        )}
      </div>

      <section className="chartBox">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h2 style={{ margin: 0 }}>Sales</h2>
          <select 
            value={timeGranularity} 
            onChange={(e) => setTimeGranularity(e.target.value)} 
            style={{ width: "auto", minWidth: "120px", padding: "8px", borderRadius: "6px", border: "1px solid #d8b6c3", backgroundColor: "white", outline: "none", cursor: "pointer" }}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 500px" }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeSeriesData}>
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="sales">
                  {timeSeriesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex: "1 1 300px" }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={timeSeriesData}
                  dataKey="sales"
                  nameKey="time"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8b2f4d"
                  label
                >
                  {timeSeriesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {!selectedCategory && (
        <section className="chartBox">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h2 style={{ margin: 0 }}>Sales By Category</h2>
            <select 
              value={categoryTimeFilter} 
              onChange={(e) => setCategoryTimeFilter(e.target.value)} 
              style={{ width: "auto", minWidth: "120px", padding: "8px", borderRadius: "6px", border: "1px solid #d8b6c3", backgroundColor: "white", outline: "none", cursor: "pointer" }}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 500px" }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="sales">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: "1 1 300px" }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="sales"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#d9a441"
                    label
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      <section className="chartBox">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h2 style={{ margin: 0 }}>Best-Selling Products</h2>
          <select 
            value={productTimeFilter} 
            onChange={(e) => setProductTimeFilter(e.target.value)} 
            style={{ width: "auto", minWidth: "120px", padding: "8px", borderRadius: "6px", border: "1px solid #d8b6c3", backgroundColor: "white", outline: "none", cursor: "pointer" }}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 500px" }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="quantity">
                  {productData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex: "1 1 300px" }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                  <Pie
                    data={productData}
                    dataKey="quantity"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#351c2a"
                    label
                  >
                    {productData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {isPurchaseModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "30px", borderRadius: "10px", width: "90%", maxWidth: "1000px", maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0 }}>All Purchase Details</h2>
              <button 
                onClick={() => setIsPurchaseModalOpen(false)}
                style={{ background: "transparent", border: "none", fontSize: "20px", cursor: "pointer", color: "#333" }}
              >
                ✖
              </button>
            </div>
            
            <div style={{ overflowX: "auto", overflowY: "auto", flex: 1 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                  <tr>
                    <th style={{ background: "#f1d6de", padding: "12px", textAlign: "left" }}>Date</th>
                    <th style={{ background: "#f1d6de", padding: "12px", textAlign: "left" }}>Customer Name</th>
                    <th style={{ background: "#f1d6de", padding: "12px", textAlign: "left" }}>Customer ID</th>
                    <th style={{ background: "#f1d6de", padding: "12px", textAlign: "left" }}>Email ID</th>
                    <th style={{ background: "#f1d6de", padding: "12px", textAlign: "left" }}>Product</th>
                    <th style={{ background: "#f1d6de", padding: "12px", textAlign: "left" }}>Qty</th>
                    <th style={{ background: "#f1d6de", padding: "12px", textAlign: "left" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.map(p => (
                    <tr key={p._id} style={{ borderBottom: "1px solid #efdce3" }}>
                      <td style={{ padding: "12px" }}>{format(new Date(p.purchaseDate || p.createdAt), "MMM dd, yyyy")}</td>
                      <td style={{ padding: "12px" }}>{p.customer?.name || "Unknown"}</td>
                      <td style={{ padding: "12px", fontSize: "13px", color: "#666" }}>{p.customer?._id || "N/A"}</td>
                      <td style={{ padding: "12px", fontSize: "13px", color: "#666" }}>{p.customer?.email || "N/A"}</td>
                      <td style={{ padding: "12px" }}>{p.product?.name || "Unknown"}</td>
                      <td style={{ padding: "12px" }}>{p.quantity}</td>
                      <td style={{ padding: "12px", fontWeight: "bold" }}>₹{p.totalAmount}</td>
                    </tr>
                  ))}
                  {filteredPurchases.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ padding: "20px", textAlign: "center" }}>No purchases match your criteria.</td>
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

export default Analytics;