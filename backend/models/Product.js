import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    sku: String,
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    size: String,
    color: String,
    imageUrl: { type: String, default: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80" }
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product;