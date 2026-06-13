import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.MODE === "development" 
    ? "http://localhost:5000/api" 
    : "https://tanvi-boutique.onrender.com/api"
});

API.interceptors.request.use((req) => {
  const userInfo = localStorage.getItem("userInfo");
  if (userInfo) {
    const { token } = JSON.parse(userInfo);
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;