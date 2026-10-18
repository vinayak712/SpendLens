# 🔍 SpendLens — AI-Powered Expense Intelligence Platform

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI%20Vision-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)

**SpendLens** is a modern, full-stack expense intelligence platform that transforms the way you track, analyze, and manage your personal finances. Powered by **Google Gemini AI**, SpendLens extracts expense details directly from receipts, bills, invoices, and bank transaction SMS screenshots—instantly categorizing your spending, detecting anomalies, and delivering actionable financial insights.

---

## ✨ Key Features

- 🧾 **AI-Powered Receipt & Invoice Scanner**:
  - Upload receipts, bills, or invoices (images or PDFs).
  - Powered by **Google Gemini Vision** models to automatically extract merchant name, transaction amount, date, and category.
- 💬 **SMS & UPI Text Parsing**:
  - Paste any transaction SMS or UPI notification text; Gemini automatically structures it into an expense record.
- 🏷️ **Smart Merchant Normalization**:
  - Intelligently decodes cryptic UPI merchant VPAs (e.g., `PAYTM-SWIGGY-129@ybl` → `Swiggy`) and maintains a learning database of merchant mappings.
- 📊 **Interactive Analytics Dashboard**:
  - Beautiful visual breakdown with **Recharts**:
    - Monthly spending trends.
    - Category breakdown (Donut charts).
    - Top merchants by total spend.
    - Day-by-day expenditure tracking.
- 💡 **AI Financial Advisor & Insights**:
  - Automated spending anomaly detection.
  - Personalized budget pacing alerts and smart savings recommendations.
- 🎯 **Budget Tracking & Multi-Currency**:
  - Set custom monthly budgets with visual progress indicators.
  - Support for multiple currencies (`USD`, `EUR`, `INR`, `GBP`, etc.).
- 🌓 **Dark & Light Mode**:
  - Fully responsive, modern user interface crafted with Tailwind CSS with smooth transitions and theme persistence.
- 🔐 **Secure Authentication**:
  - JWT authentication with secure `httpOnly` cookies and encrypted passwords with bcrypt.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Routing**: [React Router DOM v7](https://reactrouter.com/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Uploads**: [React Dropzone](https://react-dropzone.js.org/)
- **Notifications**: [React Hot Toast](https://react-hot-toast.com/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) with [Mongoose](https://mongoosejs.com/)
- **Artificial Intelligence**: [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai) (Google Gemini SDK)
- **Image & File Hosting**: [Cloudinary](https://cloudinary.com/) + [Multer](https://github.com/expressjs/multer)
- **PDF Extraction**: [pdf-parse](https://www.npmjs.com/package/pdf-parse)
- **Authentication**: [JSON Web Token (JWT)](https://jwt.io/) + [bcryptjs](https://www.npmjs.com/package/bcryptjs) + [cookie-parser](https://www.npmjs.com/package/cookie-parser)

---

## 📁 Project Structure

```text
SpendLens/
├── backend/
│   ├── config/              # MongoDB connection & setup
│   ├── controllers/         # Request handlers (auth, expenses, analytics, insights, merchants)
│   ├── middlewares/         # Auth verification, error handling, file uploads
│   ├── models/              # Mongoose schemas (User, Expense, MerchantMapping)
│   ├── routes/              # Express API route declarations
│   ├── services/            # Gemini AI & Cloudinary integration services
│   ├── utils/               # Helper functions
│   ├── .env.example         # Template for backend environment variables
│   ├── package.json
│   └── server.js            # Express server entry point
│
├── frontend/
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # UI components (Sidebar, Navbar, ExpenseCard, etc.)
│   │   ├── context/         # React Context (AuthContext, ThemeContext)
│   │   ├── pages/           # Pages (Dashboard, AddExpense, Transactions, Analytics, Insights, Settings)
│   │   ├── services/        # Axios API client
│   │   ├── App.jsx          # App routing and shell
│   │   ├── main.jsx         # React DOM entry point
│   │   └── index.css        # Tailwind CSS styles
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── .gitignore               # Root git ignore file
└── README.md
```

---

## 🚀 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB Atlas](https://www.mongodb.com/atlas) account (or local MongoDB)
- [Cloudinary](https://cloudinary.com/) account (free tier)
- [Google AI Studio](https://aistudio.google.com/) Gemini API Key

---

### 1. Clone the Repository
```bash
git clone https://github.com/vinayak712/SpendLens.git
cd SpendLens
```

---

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` file from the template:
   ```bash
   cp .env.example .env
   ```
4. Fill in your credentials in `backend/.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=30d
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   GEMINI_API_KEY=your_gemini_api_key
   CLIENT_URL=http://localhost:5173
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The backend will be running at `http://localhost:5000`.*

---

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` file:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *The application will be live at `http://localhost:5173`.*

---

## 📡 API Endpoints

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | Public |
| `POST` | `/api/auth/login` | Login user & set cookie | Public |
| `POST` | `/api/auth/logout` | Logout user & clear cookie | Private |
| `GET` | `/api/auth/me` | Fetch authenticated user | Private |
| `GET` | `/api/expenses` | Get all expenses with filtering & pagination | Private |
| `POST` | `/api/expenses` | Create a manual expense | Private |
| `POST` | `/api/expenses/scan-receipt` | Scan receipt with Gemini Vision | Private |
| `POST` | `/api/expenses/parse-text` | Parse transaction SMS or text with Gemini | Private |
| `GET` | `/api/analytics/summary` | Overall financial metrics and budget usage | Private |
| `GET` | `/api/analytics/category-breakdown` | Spending grouped by category | Private |
| `GET` | `/api/analytics/monthly-trend` | Monthly spending historical trends | Private |
| `GET` | `/api/insights/recommendations` | AI-generated financial advice and insights | Private |

---

## ☁️ Deployment

### Backend on [Render](https://render.com)
1. Create a **New Web Service** connected to your repository.
2. Set **Root Directory** to `backend`.
3. Set **Build Command** to `npm install`.
4. Set **Start Command** to `npm start`.
5. Add all environment variables from `backend/.env` (with `CLIENT_URL` pointing to your Vercel URL).

### Frontend on [Vercel](https://vercel.com)
1. Import your GitHub repository in Vercel.
2. Set **Root Directory** to `frontend`.
3. Framework Preset: **Vite**.
4. Add the environment variable:
   ```env
   VITE_API_URL=https://<your-render-backend-url>/api
   ```
5. Deploy!

---

## 🛡️ License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

Developed by **[vinayak712](https://github.com/vinayak712)**
