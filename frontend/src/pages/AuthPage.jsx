import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../api";

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const { login, register } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer" // Default role
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    try {
      if (isForgotPassword) {
        const res = await API.post("/auth/forgot-password", { email: form.email });
        setMessage(res.data.message);
        return;
      } else if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register(form);
      }
      // Redirect back to where they came from or home
      const from = location.state?.from?.pathname || "/";
      navigate(from);
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
    }
  };

  return (
    <div className="auth-container" style={{ maxWidth: "400px", margin: "40px auto", padding: "20px", background: "#fff", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
      <h2>{isForgotPassword ? "Reset Password" : isLogin ? "Login" : "Register"}</h2>
      
      {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}
      {message && <div style={{ color: "green", marginBottom: "10px" }}>{message}</div>}
      
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {!isLogin && !isForgotPassword && (
          <input
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            required
            style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
          />
        )}
        
        <input
          name="email"
          type="email"
          placeholder="Email Address"
          value={form.email}
          onChange={handleChange}
          required
          style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
        />
        
        {!isForgotPassword && (
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
          />
        )}

        {!isLogin && (
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <label>Role:</label>
            <select name="role" value={form.role} onChange={handleChange} style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc", flex: 1 }}>
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        )}
        
        <button type="submit" style={{ padding: "10px", background: "#8b2f4d", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          {isForgotPassword ? "Send Reset Link" : isLogin ? "Login" : "Register"}
        </button>
      </form>
      
      {!isForgotPassword && isLogin && (
        <div style={{ marginTop: "15px", textAlign: "center" }}>
          <button 
            onClick={() => { setIsForgotPassword(true); setError(""); setMessage(""); }} 
            style={{ background: "none", border: "none", color: "#666", cursor: "pointer", textDecoration: "underline" }}
          >
            Forgot Password?
          </button>
        </div>
      )}

      {isForgotPassword && (
        <div style={{ marginTop: "15px", textAlign: "center" }}>
          <button 
            onClick={() => { setIsForgotPassword(false); setError(""); setMessage(""); }} 
            style={{ background: "none", border: "none", color: "#8b2f4d", cursor: "pointer", textDecoration: "underline" }}
          >
            Back to Login
          </button>
        </div>
      )}

      {!isForgotPassword && (
        <p style={{ marginTop: "20px", textAlign: "center" }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(""); setMessage(""); }} 
            style={{ background: "none", border: "none", color: "#8b2f4d", cursor: "pointer", textDecoration: "underline" }}
          >
            {isLogin ? "Register here" : "Login here"}
          </button>
        </p>
      )}
    </div>
  );
}

export default AuthPage;
