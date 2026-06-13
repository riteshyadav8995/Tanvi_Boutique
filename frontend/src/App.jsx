import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Purchases from "./pages/Purchases";
import Analytics from "./pages/Analytics";
import AuthPage from "./pages/AuthPage";
import ResetPassword from "./pages/ResetPassword";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} />;
  }

  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/products" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Navbar />

          <main className="container">
            <Routes>
              <Route path="/login" element={<AuthPage />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

              <Route path="/products" element={<Products />} />

              <Route path="/" element={<ProtectedRoute adminOnly={true}><Dashboard /></ProtectedRoute>} />
              <Route path="/customers" element={<ProtectedRoute adminOnly={true}><Customers /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute adminOnly={true}><Analytics /></ProtectedRoute>} />

              <Route path="/purchases" element={<ProtectedRoute><Purchases /></ProtectedRoute>} />
            </Routes>
          </main>

          <Footer />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;