import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    try {
      const res = await API.post("/auth/reset-password", { token, newPassword: password });
      setMessage(res.data.message);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired token");
    }
  };

  return (
    <div className="auth-container" style={{ maxWidth: "400px", margin: "40px auto", padding: "20px", background: "#fff", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
      <h2>Reset Password</h2>
      
      {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}
      {message && <div style={{ color: "green", marginBottom: "10px" }}>{message} <br/> Redirecting to login...</div>}
      
      {!message && (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
          />
          
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
          />
          
          <button type="submit" style={{ padding: "10px", background: "#8b2f4d", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
            Update Password
          </button>
        </form>
      )}
    </div>
  );
}

export default ResetPassword;
