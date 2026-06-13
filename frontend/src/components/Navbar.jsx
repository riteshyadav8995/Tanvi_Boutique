import { NavLink, useNavigate } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import API from "../api";

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { cart, isCartOpen, setIsCartOpen, updateQuantity, clearCart } = useContext(CartContext);
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [selectedCartCustomer, setSelectedCartCustomer] = useState("");

  const [checkoutStep, setCheckoutStep] = useState("CART");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [cardType, setCardType] = useState("");
  const [cardDetails, setCardDetails] = useState({ number: "", expiry: "", cvv: "" });
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "", email: "", phone: "", address: "", birthday: "", preferredCategory: "", notes: ""
  });

  useEffect(() => {
    if (!isCartOpen) {
      setCheckoutStep("CART");
      setPaymentMethod("");
      setCardType("");
      setCardDetails({ number: "", expiry: "", cvv: "" });
      setOtp("");
      setOtpError("");
    }
  }, [isCartOpen]);

  useEffect(() => {
    if (user?.role === "admin") {
      API.get("/customers").then(res => setCustomers(res.data)).catch(console.error);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleCheckout = async (finalMethod) => {
    if (user?.role === "admin" && !selectedCartCustomer) {
      alert("Please select a customer for this purchase.");
      setCheckoutStep("CART");
      return;
    }

    setCheckoutStep("PROCESSING");

    try {
      const promises = cart.map(item => {
        return API.post("/purchases", {
          customer: user?.role === "admin" ? selectedCartCustomer : undefined,
          product: item.product._id,
          quantity: item.quantity,
          totalAmount: item.quantity * item.product.price,
          paymentMethod: finalMethod
        });
      });

      await Promise.all(promises);
      setCheckoutStep("SUCCESS");
      clearCart();
      setTimeout(() => {
        setIsCartOpen(false);
        window.location.href = "/purchases";
      }, 2000);
    } catch (err) {
      console.error(err);
      alert("Checkout failed. Please try again.");
      setCheckoutStep("CART");
    }
  };

  const handleOtpSubmit = async () => {
    if (!otp) {
      setOtpError("Please enter the OTP");
      return;
    }

    setOtpError("");
    setCheckoutStep("PROCESSING");
    try {
      const res = await API.post("/auth/verify-otp", { otp });
      if (res.data.success) {
        handleCheckout(`${cardType} (${paymentMethod})`);
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || "Invalid OTP. Please try again.");
      setCheckoutStep("OTP");
    }
  };

  const requestOtp = async () => {
    if (cardDetails.number.length < 16) return alert("Enter 16 digit card number");
    setCheckoutStep("PROCESSING");
    try {
      await API.post("/auth/send-otp");
      setCheckoutStep("OTP");
    } catch (err) {
      alert("Failed to send OTP. Please try again.");
      setCheckoutStep("CARD_DETAILS");
    }
  };

  const renderCartItems = () => (
    <>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
        {cart.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {cart.map(item => (
              <div key={item.product._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f1f1", paddingBottom: "15px" }}>
                <div>
                  <strong style={{ display: "block", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.product.name}
                  </strong>
                  <div style={{ color: "#666", fontSize: "14px" }}>₹{item.product.price} each</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <select
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.product._id, Number(e.target.value))}
                    style={{ padding: "5px", borderRadius: "4px", width: "60px" }}
                  >
                    {[...Array(item.product.stock).keys()].map(i => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => updateQuantity(item.product._id, 0)}
                    style={{ background: "transparent", color: "#d9534f", border: "none", cursor: "pointer", fontSize: "16px", padding: "0 5px" }}
                    title="Remove item"
                  >
                    🗑️
                  </button>
                  <div style={{ fontWeight: "bold", width: "50px", textAlign: "right" }}>
                    ₹{item.quantity * item.product.price}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div style={{ padding: "20px", borderTop: "1px solid #efdce3", background: "#fafafa" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", fontSize: "18px", fontWeight: "bold" }}>
            <span>Total:</span>
            <span>₹{cart.reduce((sum, item) => sum + (item.quantity * item.product.price), 0)}</span>
          </div>

          {user?.role === "admin" && (
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "bold" }}>Select Customer:</label>
              <select
                value={selectedCartCustomer}
                onChange={(e) => setSelectedCartCustomer(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
              >
                <option value="">-- Choose Customer --</option>
                {customers.map(c => (
                  <option key={c._id} value={c._id}>{c.name} ({c.phone || c.email})</option>
                ))}
              </select>
            </div>
          )}

          <button
            className="confirmPurchaseBtn"
            onClick={() => {
              if (user?.role === "admin" && !selectedCartCustomer) {
                alert("Please select a customer for this purchase.");
                return;
              }
              setCheckoutStep("PAYMENT_METHOD");
            }}
          >
            Confirm Purchase
          </button>
        </div>
      )}
    </>
  );

  const renderCheckoutFlow = () => {
    switch (checkoutStep) {
      case "PAYMENT_METHOD":
        return (
          <div style={{ padding: "20px" }}>
            <h3>Select Payment Method</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px" }}>
              <button className="confirmPurchaseBtn" style={{ width: "100%", margin: "0" }} onClick={() => handleCheckout("UPI")}>UPI</button>
              <button className="confirmPurchaseBtn" style={{ width: "100%", margin: "0" }} onClick={() => handleCheckout("Cash")}>Cash</button>
              <button className="confirmPurchaseBtn" style={{ width: "100%", margin: "0" }} onClick={() => { setPaymentMethod("Card"); setCheckoutStep("CARD_TYPE"); }}>Card</button>
            </div>
            <button onClick={() => setCheckoutStep("CART")} style={{ marginTop: "20px", background: "transparent", border: "none", cursor: "pointer", color: "#666" }}>← Back to Cart</button>
          </div>
        );
      case "CARD_TYPE":
        return (
          <div style={{ padding: "20px" }}>
            <h3>Select Card Type</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px" }}>
              <button className="confirmPurchaseBtn" style={{ width: "100%", margin: "0" }} onClick={() => { setCardType("Credit Card"); setCheckoutStep("CARD_DETAILS"); }}>Credit Card</button>
              <button className="confirmPurchaseBtn" style={{ width: "100%", margin: "0" }} onClick={() => { setCardType("Debit Card"); setCheckoutStep("CARD_DETAILS"); }}>Debit Card</button>
            </div>
            <button onClick={() => setCheckoutStep("PAYMENT_METHOD")} style={{ marginTop: "20px", background: "transparent", border: "none", cursor: "pointer", color: "#666" }}>← Back</button>
          </div>
        );
      case "CARD_DETAILS":
        return (
          <div style={{ padding: "20px" }}>
            <h3>Enter Card Details</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
              <input type="text" placeholder="Card Number (16 digits)" maxLength="16" value={cardDetails.number} onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })} style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }} />
              <div style={{ display: "flex", gap: "10px" }}>
                <input type="text" placeholder="MM/YY" maxLength="5" value={cardDetails.expiry} onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })} style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc", width: "50%" }} />
                <input type="password" placeholder="CVV" maxLength="3" value={cardDetails.cvv} onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })} style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc", width: "50%" }} />
              </div>
              <button className="confirmPurchaseBtn" style={{ width: "100%", margin: "0" }} onClick={requestOtp}>Proceed to Pay</button>
            </div>
            <button onClick={() => setCheckoutStep("CARD_TYPE")} style={{ marginTop: "20px", background: "transparent", border: "none", cursor: "pointer", color: "#666" }}>← Back</button>
          </div>
        );
      case "OTP":
        return (
          <div style={{ padding: "20px", textAlign: "center" }}>
            <h3>OTP Verification</h3>
            <p>An OTP has been sent to your registered email.</p>
            <input type="text" placeholder="Enter OTP (Check Console Log URL)" maxLength="4" value={otp} onChange={(e) => setOtp(e.target.value)} style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc", width: "100%", marginTop: "10px", textAlign: "center", fontSize: "18px", letterSpacing: "5px" }} />
            {otpError && <p style={{ color: "red", fontSize: "14px", marginTop: "10px" }}>{otpError}</p>}
            <button className="confirmPurchaseBtn" style={{ width: "100%", margin: "20px 0 0 0" }} onClick={handleOtpSubmit}>Verify & Pay</button>
            <button onClick={() => setCheckoutStep("CARD_DETAILS")} style={{ marginTop: "20px", background: "transparent", border: "none", cursor: "pointer", color: "#666" }}>← Back</button>
          </div>
        );
      case "PROCESSING":
        return (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <h3>Processing Payment...</h3>
            <p>Please do not close this window.</p>
          </div>
        );
      case "SUCCESS":
        return (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "green" }}>
            <h3 style={{ color: "green" }}>✅ Payment Successful!</h3>
            <p>A confirmation email has been sent to you.</p>
            <p>Redirecting to purchases...</p>
          </div>
        );
      default:
        return renderCartItems();
    }
  };

  const openProfileModal = async () => {
    try {
      const res = await API.get("/auth/profile");
      setProfileForm({
        name: res.data.name || "",
        email: res.data.email || "",
        phone: res.data.phone || "",
        address: res.data.address || "",
        birthday: res.data.birthday || "",
        preferredCategory: res.data.preferredCategory || "",
        notes: res.data.notes || ""
      });
      setIsProfileModalOpen(true);
    } catch (err) {
      console.error(err);
      alert("Failed to load profile details");
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...profileForm };
      const res = await API.put("/auth/profile", payload);
      alert("Profile updated successfully!");
      setIsProfileModalOpen(false);
      if (payload.email !== user.email) {
        handleLogout();
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update profile");
    }
  };

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brandLogo">TB</div>
        <div className="brandText">
          <h2>Tanvi Boutique</h2>
          <p>Premium Store</p>
        </div>
      </div>

      <div className="topbar-right">
        <nav className="navLinks">
          {user?.role === "admin" && <NavLink to="/">Dashboard</NavLink>}
          <NavLink to="/products">Products</NavLink>
          {user && user.role !== "admin" && (
            <button
              className="cartBtn"
              onClick={() => setIsCartOpen(true)}
            >
              Cart ({cart.length})
            </button>
          )}
          {user && <NavLink to="/purchases">Purchases</NavLink>}
          {user?.role === "admin" && (
            <>
              <NavLink to="/customers">Customers</NavLink>
              <NavLink to="/analytics">Analytics</NavLink>
            </>
          )}
        </nav>

        <div className="auth-section">
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <span
                style={{ color: "#eadce3", fontWeight: "bold", cursor: "pointer", textDecoration: "underline" }}
                onClick={openProfileModal}
                title="View & Edit Profile"
              >
                Hi, {user.name}
              </span>
              <button onClick={handleLogout} className="authBtn">Logout</button>
            </div>
          ) : (
            <button onClick={() => navigate("/login")} className="authBtn">Login</button>
          )}
        </div>
      </div>

      {isCartOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "flex-end", zIndex: 1000 }}>
          <div style={{ background: "white", width: "100%", maxWidth: "400px", height: "100%", display: "flex", flexDirection: "column", boxShadow: "-2px 0 10px rgba(0,0,0,0.1)", color: "#333" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", borderBottom: "1px solid #efdce3" }}>
              <h2 style={{ margin: 0 }}>Your Cart</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                style={{ background: "transparent", border: "none", fontSize: "20px", cursor: "pointer", color: "#333" }}
              >
                ✖
              </button>
            </div>
            {renderCheckoutFlow()}
          </div>
        </div>
      )}

      {isProfileModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", width: "90%", maxWidth: "500px", padding: "30px", borderRadius: "10px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)", color: "#333", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #8b2f4d", paddingBottom: "10px", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, color: "#351c2a" }}>Your Profile</h2>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                style={{ background: "transparent", border: "none", fontSize: "20px", cursor: "pointer", color: "#333" }}
              >
                ✖
              </button>
            </div>

            <form onSubmit={handleProfileUpdate} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#5c2538" }}>Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#5c2538" }}>Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
                    required
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#5c2538" }}>Phone</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#5c2538" }}>Birthday</label>
                  <input
                    type="date"
                    value={profileForm.birthday}
                    onChange={(e) => setProfileForm({ ...profileForm, birthday: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#5c2538" }}>Address</label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#5c2538" }}>Preferred Category</label>
                <input
                  type="text"
                  value={profileForm.preferredCategory}
                  onChange={(e) => setProfileForm({ ...profileForm, preferredCategory: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#5c2538" }}>Notes (Optional)</label>
                <textarea
                  value={profileForm.notes}
                  onChange={(e) => setProfileForm({ ...profileForm, notes: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc", minHeight: "80px", fontFamily: "inherit" }}
                />
              </div>
              <button
                type="submit"
                style={{ marginTop: "20px", width: "100%", padding: "12px", background: "#8b2f4d", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", cursor: "pointer", fontWeight: "bold" }}
              >
                Update Profile
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;