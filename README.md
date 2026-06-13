# Tanvi Boutique - Premium Fashion Store & CRM

Tanvi Boutique is a full-stack, responsive Web Application and Customer Relationship Management (CRM) system designed for a premium fashion boutique. 

It provides an elegant interface for both **Store Administrators** to manage inventory and sales, and for **Customers** to make purchases, manage their profiles, and view their order history.

---

## 🌟 Key Features

### 👑 For Administrators (Tanvi Boutique Team):
- **Dashboard:** An overview of key business metrics (Total Revenue, Active Customers, Products in Stock).
- **Product Management:** Add, edit, update stock, and delete products from the boutique inventory.
- **Customer CRM:** Manage customer profiles, track their purchase history, record special tailoring notes, and view top spenders.
- **Advanced Analytics:** Beautiful, interactive charts (Bar Charts & Pie Charts) visualizing revenue trends and product sales distribution.
- **Purchase Tracking:** A complete history of all store transactions and the ability to log manual cash/card/UPI purchases on behalf of walk-in customers.

### 🛍️ For Customers:
- **Elegant Shopping Interface:** Browse the boutique's premium catalog of clothes, accessories, and unstitched fabrics.
- **Shopping Cart & Checkout:** A smooth shopping cart experience with multiple payment method options (Card, UPI, Cash) and integrated email OTP verification.
- **Personalized Profile:** Customers can update their personal details, address, phone number, birthday, and preferred fashion categories directly from their Navbar profile.
- **Purchase History:** A dedicated portal for customers to review their past orders, total amounts, and dates of purchase.
- **Email Notifications:** Automated email confirmations sent out when a purchase is successfully processed.

---

## 🛠️ Technology Stack

- **Frontend:** React.js, Vite, React Router v6, Recharts (for Analytics Data Visualization)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Authentication:** JSON Web Tokens (JWT), bcryptjs for password hashing
- **Email Services:** Nodemailer (with Ethereal for testing or Gmail for production)
- **Styling:** Custom CSS (vibrant, premium aesthetics with glassmorphism touches)

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) and [MongoDB](https://www.mongodb.com/) installed on your machine.

### 1. Clone the repository
\`\`\`
git clone https://github.com/your-username/tanvi-boutique.git
cd tanvi-boutique
\`\`\`

### 2. Set up the Backend
\`\`\`
cd backend
npm install
\`\`\`

Create a \`.env\` file in the \`backend\` directory and add the following variables:
\`\`\`env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/tanvi_boutique
JWT_SECRET=your_super_secret_jwt_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
\`\`\`

Start the backend server:
\`\`\`
npm run dev
\`\`\`

### 3. Set up the Frontend
Open a new terminal window/tab:
\`\`\`
cd frontend
npm install
\`\`\`

Start the frontend development server:
\`\`\`
npm run dev
\`\`\`

The frontend will typically run at \`http://localhost:5173\`.

---

## 🔐 Default Roles

When registering a new account:
- **Admin:** Must register with the email ending in \`@tanvi.co.in\` (e.g., \`tanvi@tanvi.co.in\`) and select the "Admin" role.
- **Customer:** Any standard email address (e.g., \`name@gmail.com\`). Cannot register with the boutique's domain.

---

## 📝 License
This project is for educational and portfolio purposes. Feel free to use it as inspiration!
