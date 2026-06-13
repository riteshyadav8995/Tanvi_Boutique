import { useEffect, useState } from "react";
import API from "../api";
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

const COLORS = ['#8b2f4d', '#d9a441', '#415a77', '#778da9', '#6d597a', '#b56576', '#e56b6f', '#eaac8b'];

function Dashboard() {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);

  const fetchData = async () => {
    const customerRes = await API.get("/customers");
    const productRes = await API.get("/products");
    const purchaseRes = await API.get("/purchases");

    setCustomers(customerRes.data);
    setProducts(productRes.data);
    setPurchases(purchaseRes.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalSales = purchases.reduce(
    (sum, purchase) => sum + purchase.totalAmount,
    0
  );

  const categorySales = {};

  purchases.forEach((purchase) => {
    const category = purchase.product?.category || "Unknown";
    categorySales[category] =
      (categorySales[category] || 0) + purchase.totalAmount;
  });

  const chartData = Object.keys(categorySales).map((category) => ({
    category,
    sales: categorySales[category]
  }));

  return (
    <div>
      <h1>Dashboard</h1>

      <div className="cards">
        <div className="card">
          <h3>Total Customers</h3>
          <p>{customers.length}</p>
        </div>

        <div className="card">
          <h3>Total Products</h3>
          <p>{products.length}</p>
        </div>

        <div className="card">
          <h3>Total Purchases</h3>
          <p>{purchases.length}</p>
        </div>

        <div className="card">
          <h3>Total Sales</h3>
          <p>₹{totalSales}</p>
        </div>
      </div>

      <section className="chartBox" style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 500px" }}>
          <h2>Category Wise Sales (Bar)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sales">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ flex: "1 1 300px" }}>
          <h2>Category Wise Sales (Pie)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="sales"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;