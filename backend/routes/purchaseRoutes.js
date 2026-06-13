import express from "express";
import Purchase from "../models/Purchase.js";
import Product from "../models/Product.js";
import { protect } from "../middleware/authMiddleware.js";
import { sendConfirmationEmail } from "../utils/emailService.js";

const router = express.Router();

router.post("/", protect, async (req, res) => {
    try {
        let { customer, product, quantity, totalAmount, paymentMethod, discount } = req.body;

        if (req.user.role !== "admin") {
            customer = req.user.customerId;
        }

        const productDetails = await Product.findById(product);
        if (!productDetails) {
            return res.status(404).json({ message: "Product not found" });
        }

        const purchase = await Purchase.create({
            customer,
            product,
            quantity,
            price: productDetails.price,
            discount: discount || 0,
            totalAmount,
            paymentMethod
        });

        await Product.findByIdAndUpdate(product, {
            $inc: { stock: -quantity }
        });

        const purchaseDetails = `Product: ${productDetails.name}\nQuantity: ${quantity}\nTotal Amount: ₹${totalAmount}\nPayment Method: ${paymentMethod}`;
        await sendConfirmationEmail(req.user, purchaseDetails);

        res.status(201).json(purchase);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.get("/", protect, async (req, res) => {
    let query = {};
    if (req.user.role !== "admin") {
        query.customer = req.user.customerId;
    }
    const purchases = await Purchase.find(query)
        .populate("customer")
        .populate("product")
        .sort({ createdAt: -1 });

    res.json(purchases);
});

export default router;