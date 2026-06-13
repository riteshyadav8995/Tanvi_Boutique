import express from "express";
import Purchase from "../models/Purchase.js";
import Customer from "../models/Customer.js";
import Product from "../models/Product.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, admin, async (req, res) => {
  try {
    const { category } = req.query;
    let productQuery = {};
    if (category) productQuery.category = category;

    const customers = await Customer.find();
    const products = await Product.find(productQuery);
    
    let purchases = await Purchase.find()
      .populate("customer")
      .populate("product");
      
    if (category) {
      purchases = purchases.filter(p => p.product && p.product.category === category);
    }

    const totalRevenue = purchases.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );

    const averagePurchaseValue =
      purchases.length > 0 ? totalRevenue / purchases.length : 0;

    const customerPurchaseCount = {};

    purchases.forEach((purchase) => {
      const id = purchase.customer?._id?.toString();
      if (id) {
        customerPurchaseCount[id] = (customerPurchaseCount[id] || 0) + 1;
      }
    });

    const repeatCustomers = Object.values(customerPurchaseCount).filter(
      (count) => count > 1
    ).length;

    const repeatPurchaseRate =
      customers.length > 0 ? (repeatCustomers / customers.length) * 100 : 0;

    const salesByCategory = {};
    const topProducts = {};
    const topCustomers = {};
    const monthlySales = {};

    purchases.forEach((purchase) => {
      const category = purchase.product?.category || "Unknown";
      salesByCategory[category] =
        (salesByCategory[category] || 0) + purchase.totalAmount;

      const productName = purchase.product?.name || "Unknown";
      topProducts[productName] =
        (topProducts[productName] || 0) + purchase.quantity;

      const customerName = purchase.customer?.name || "Unknown";
      topCustomers[customerName] =
        (topCustomers[customerName] || 0) + purchase.totalAmount;

      const month = new Date(purchase.purchaseDate).toLocaleString("en-US", {
        month: "short",
        year: "numeric"
      });

      monthlySales[month] = (monthlySales[month] || 0) + purchase.totalAmount;
    });

    const lowStockProducts = products.filter((product) => product.stock <= 5);

    res.json({
      totalCustomers: customers.length,
      totalProducts: products.length,
      totalPurchases: purchases.length,
      totalRevenue,
      averagePurchaseValue,
      repeatCustomers,
      repeatPurchaseRate,
      recentPurchases: purchases.slice(-5).reverse(),
      lowStockProducts,
      salesByCategory,
      topProducts,
      topCustomers,
      monthlySales
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;