import express from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import Customer from "../models/Customer.js";
import { protect } from "../middleware/authMiddleware.js";
import { sendOTPEmail, sendPasswordResetEmail } from "../utils/emailService.js";

const router = express.Router();

// Simple in-memory store for OTPs: { userId: { otp, expiresAt } }
const otpStore = new Map();

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || "default_secret", {
    expiresIn: "30d",
  });
};

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const adminRegex = /^[^\s@]+@tanvi\.co\.in$/;

    if (role === "admin") {
      // Admin email must be exactly @tanvi.co.in
      if (!adminRegex.test(email)) {
        return res.status(400).json({ message: "Admin email must be in format name@tanvi.co.in" });
      }
    } else {
      // Customer cannot use admin email
      if (adminRegex.test(email)) {
        return res.status(400).json({ message: "Cannot use admin email for customer registration" });
      }
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const customerExists = await Customer.findOne({ email });
    let customerId = customerExists ? customerExists._id : null;

    if (role !== "admin" && !customerExists) {
      const newCustomer = await Customer.create({
        name,
        email,
        phone: "Not Provided", // required field in Customer
      });
      customerId = newCustomer._id;
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || "customer",
      customerId,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        customerId: user.customerId,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        customerId: user.customerId,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/send-otp", protect, async (req, res) => {
  try {
    const otp = Math.floor(1000 + Math.random() * 9000).toString(); // Generate 4-digit OTP
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

    otpStore.set(req.user._id.toString(), { otp, expiresAt });

    await sendOTPEmail(req.user, otp);

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to send OTP", error: error.message });
  }
});

router.post("/verify-otp", protect, async (req, res) => {
  try {
    const { otp } = req.body;
    const userId = req.user._id.toString();

    const storedData = otpStore.get(userId);

    if (!storedData) {
      return res.status(400).json({ message: "No OTP found. Please request a new one." });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(userId);
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    if (storedData.otp === otp) {
      otpStore.delete(userId); // Clear OTP after successful verification
      return res.json({ success: true, message: "OTP verified successfully" });
    } else {
      return res.status(400).json({ message: "Invalid OTP" });
    }
  } catch (error) {
    res.status(500).json({ message: "OTP verification failed", error: error.message });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Return 404 but don't leak whether the email is registered or not in production
      // For this project, a clear message is fine
      return res.status(404).json({ message: "No user found with that email" });
    }

    // Generate token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set expire (15 minutes)
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await user.save();

    // Create reset url (frontend URL)
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    try {
      await sendPasswordResetEmail(user, resetUrl);
      res.json({ success: true, message: "Email sent" });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ message: "Email could not be sent" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Set new password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      let customerData = null;
      if (user.customerId) {
        customerData = await Customer.findById(user.customerId);
      }
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        customerId: user.customerId,
        phone: customerData?.phone || "",
        address: customerData?.address || "",
        birthday: customerData?.birthday ? customerData.birthday.toISOString().split("T")[0] : "",
        preferredCategory: customerData?.preferredCategory || "",
        notes: customerData?.notes || "",
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();
      
      let customerData = null;
      if (user.customerId) {
        customerData = await Customer.findById(user.customerId);
        if (customerData) {
          customerData.name = req.body.name || customerData.name;
          customerData.email = req.body.email || customerData.email;
          if (req.body.phone !== undefined) customerData.phone = req.body.phone;
          if (req.body.address !== undefined) customerData.address = req.body.address;
          if (req.body.birthday !== undefined) customerData.birthday = req.body.birthday;
          if (req.body.preferredCategory !== undefined) customerData.preferredCategory = req.body.preferredCategory;
          if (req.body.notes !== undefined) customerData.notes = req.body.notes;
          await customerData.save();
        }
      }

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        customerId: updatedUser.customerId,
        phone: customerData?.phone || "",
        address: customerData?.address || "",
        birthday: customerData?.birthday ? customerData.birthday.toISOString().split("T")[0] : "",
        preferredCategory: customerData?.preferredCategory || "",
        notes: customerData?.notes || "",
        token: generateToken(updatedUser._id, updatedUser.role),
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
