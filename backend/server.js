import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import purchaseRoutes from "./routes/purchaseRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
    res.send("Tanvi Boutique CRM API is running");
});

mongoose
    .connect(process.env.MONGODB_URL)
    .then(() => {
        console.log("MongoDB connected");
        app.listen(process.env.PORT, () => {
            console.log(`Server running on port ${process.env.PORT}`);
        });
    })
    .catch((error) => {
        console.log(error);
    });