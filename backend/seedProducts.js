import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";

dotenv.config();

const dummyProducts = [
  {
    name: "Wireless Headphones",
    category: "Electronics",
    sku: "ELEC-WH-001",
    price: 2999,
    stock: 50,
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=500",
  },
  {
    name: "Smartphone Stand",
    category: "Electronics",
    sku: "ELEC-SS-002",
    price: 499,
    stock: 120,
    imageUrl: "https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&q=80&w=500",
  },
  {
    name: "Men's Cotton T-Shirt",
    category: "Clothing",
    sku: "CLO-MT-001",
    price: 799,
    stock: 200,
    size: "M",
    color: "Blue",
    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=500",
  },
  {
    name: "Women's Summer Dress",
    category: "Clothing",
    sku: "CLO-WD-002",
    price: 1499,
    stock: 60,
    size: "L",
    color: "Red",
    imageUrl: "https://images.unsplash.com/photo-1515347619252-b88eb3fb6334?auto=format&fit=crop&q=80&w=500",
  },
  {
    name: "Organic Honey 500g",
    category: "Groceries",
    sku: "GRO-OH-001",
    price: 350,
    stock: 80,
    imageUrl: "https://images.unsplash.com/photo-1587049352847-4d4b124a59cd?auto=format&fit=crop&q=80&w=500",
  },
  {
    name: "Almonds 1kg",
    category: "Groceries",
    sku: "GRO-AL-002",
    price: 950,
    stock: 100,
    imageUrl: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&q=80&w=500",
  },
  {
    name: "Running Shoes",
    category: "Footwear",
    sku: "FW-RS-001",
    price: 2499,
    stock: 40,
    size: "9",
    color: "Black",
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=500",
  },
  {
    name: "Leather Wallet",
    category: "Accessories",
    sku: "ACC-LW-001",
    price: 899,
    stock: 75,
    color: "Brown",
    imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=500",
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("MongoDB Connected for seeding...");

    await Product.deleteMany({});
    console.log("Existing products removed.");

    await Product.insertMany(dummyProducts);
    console.log("Dummy products inserted successfully!");

    process.exit();
  } catch (error) {
    console.error("Error seeding data: ", error);
    process.exit(1);
  }
};

seedDB();
