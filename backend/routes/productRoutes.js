import express from "express";
import Product from "../models/Product.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, admin, async (req, res) => {
    const product = await Product.create(req.body);
    res.status(201).json(product);
});

router.get("/", async (req, res) => {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
});

router.put("/:id", protect, admin, async (req, res) => {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true
    });
    res.json(product);
});

router.delete("/:id", protect, admin, async (req, res) => {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
});

export default router;