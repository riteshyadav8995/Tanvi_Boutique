import { createContext, useState, useEffect } from "react";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("tanvi_cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("tanvi_cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product._id === product._id);
      if (existingItem) {
        const newQty = Math.min(existingItem.quantity + 1, product.stock);
        return prevCart.map(item => 
          item.product._id === product._id ? { ...item, quantity: newQty } : item
        );
      } else {
        return [...prevCart, { product, quantity: 1 }];
      }
    });
    alert(`${product.name} has been added to your cart!`);
  };

  const updateQuantity = (productId, newQuantity) => {
    setCart(prevCart => {
      if (newQuantity <= 0) {
        return prevCart.filter(item => item.product._id !== productId);
      }
      return prevCart.map(item => 
        item.product._id === productId ? { ...item, quantity: newQuantity } : item
      );
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider value={{ cart, isCartOpen, setIsCartOpen, addToCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};
