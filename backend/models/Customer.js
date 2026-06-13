import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: {
      type: String,
      unique: true,
      sparse: true
    },
    address: String,
    birthday: String,
    anniversary: String,
    preferredCategory: String,
    notes: String,
    isVip: {
      type: Boolean,
      default: false
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    followUpDate: String
  },
  { timestamps: true }
);

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;