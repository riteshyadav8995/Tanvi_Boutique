import express from "express";
import Customer from "../models/Customer.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, admin, async (req, res) => {
    try {
        const adminRegex = /^[^\s@]+@tanvi\.co\.in$/;
        if (req.body.email && adminRegex.test(req.body.email)) {
            return res.status(400).json({ message: "Cannot add admin email as a customer" });
        }
        if (req.body.email) {
            const existingCustomer = await Customer.findOne({ email: req.body.email });
            if (existingCustomer) {
                return res.status(400).json({ message: "Customer with this email already exists" });
            }
        }
        const customer = await Customer.create(req.body);
        res.status(201).json(customer);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "Customer with this email already exists" });
        }
        res.status(500).json({ message: error.message });
    }
});

router.get("/", protect, admin, async (req, res) => {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
});

router.get("/:id", protect, admin, async (req, res) => {
    const customer = await Customer.findById(req.params.id);
    res.json(customer);
});

router.put("/:id", protect, admin, async (req, res) => {
    try {
        const adminRegex = /^[^\s@]+@tanvi\.co\.in$/;
        if (req.body.email && adminRegex.test(req.body.email)) {
            return res.status(400).json({ message: "Cannot update to an admin email" });
        }
        if (req.body.email) {
            const existingCustomer = await Customer.findOne({ email: req.body.email, _id: { $ne: req.params.id } });
            if (existingCustomer) {
                return res.status(400).json({ message: "Customer with this email already exists" });
            }
        }
        const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
            new: true
        });
        res.json(customer);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "Customer with this email already exists" });
        }
        res.status(500).json({ message: error.message });
    }
});

router.delete("/:id", protect, admin, async (req, res) => {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: "Customer deleted" });
});

export default router;