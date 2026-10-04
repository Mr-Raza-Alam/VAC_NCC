# VAC NCC Portal

A comprehensive, full-stack Value Added Course (VAC) Management Portal designed for Assam University students. Built on the **MERN** stack (MongoDB, Express, React, Node.js), this portal digitizes the entire student evaluation process—from bulk CSV registrations and test score tracking to Cloudflare-powered document distribution.

---

## 👥 Two Kinds of Users

This portal is built for two distinct user roles, each with their own specialized interface, security clearance, and set of features.

### 1. Admin Users (Lead Admin & Sub-Admins)
Administrators manage the portal, configure exams, evaluate students, and oversee system operations. The portal features a highly granular **Role Management** system (RBAC).
* **Role-Based Access Control (RBAC):** The 'Lead Admin' can dynamically assign specific modules to other admins (e.g., CTOs). Sub-admins will only see the sections of the portal they are authorized to access (Record, Test, System).
* **Test & Evaluation Management:** Admins can configure test dates, timings, and cut-off marks. They manage the flow of the evaluation phases (Internal 1, 2, 3, Practical, and Continuous Assessment).
* **Master Records:** Automatically compile and calculate final grades based on uploaded test and attendance data, allowing admins to search, filter, and track student performance globally.
* **Bulk Data Upload (CSV):** Automatically process and store thousands of student records and test scores via simple CSV uploads.
* **Global Settings & Broadcasts:** Admins can pin live broadcast messages across the student portal.
* **Database Reset Options:** The Lead Admin has access to highly secure, password-protected database reset tools (Nuclear Reset) to clear data for new batches, backed by an immutable Audit Log.

### 2. VAC_Student Users
Students are the end-users who consume course material, take tests, and view their evaluations.
* **Verified Registration:** Students can only register if their `vac_rollNo` was pre-authorized by an admin via CSV upload.
* **Interactive Dashboard:** Beautiful, mobile-responsive UI featuring separate tabs for **Online-Test**, **Practical-Test**, and **Continuous Assessment**, displaying real-time grades synchronized from the backend.
* **Profile Onboarding:** First-time logins require the student to complete a mandatory onboarding form (demographics, contact info, etc.).
* **Instant Auto-Login:** Secure JWT-based authentication allows students to be instantly logged in upon verifying their account.
* **Document Management (Cloudflare R2):** Students can view and download the official Syllabus and Notes directly from the Cloudflare CDN via their profile menu.

---

## 🛠️ Technology Stack

* **Frontend:** 
  * React.js (Vite)
  * React Router DOM
  * Vanilla CSS (Custom modern styling, Mobile-First Responsive Design)
* **Backend:** 
  * Node.js
  * Express.js
* **Database:** 
  * MongoDB 
  * Mongoose (Object Data Modeling)
* **Authentication & Security:** 
  * JSON Web Tokens (JWT) 
  * bcryptjs (Password Hashing)
* **File Storage (CDN):** 
  * Cloudflare R2 via `@aws-sdk/client-s3`
* **Data Processing:** 
  * Multer (File uploads)
  * `csv-parser` (Bulk data ingestion)

---

## 🚀 Installation & Setup

### 1. Prerequisites
Ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v16+)
* [MongoDB](https://www.mongodb.com/try/download/community) (Running locally or a MongoDB Atlas URI)
* A [Cloudflare](https://www.cloudflare.com/) Account (For R2 Storage)

### 2. Clone the Repository
```bash
git clone <your-repository-url>
cd VAC_NCC
```

### 3. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `/backend` directory and add the following:
```env
PORT=5000
MONGO_URI="mongodb://127.0.0.1:27017/vac_ncc"
JWT_SECRET="your_super_secret_jwt_key_here"

# Cloudflare R2 Configuration
R2_ACCOUNT_ID="your_account_id"
R2_ACCESS_KEY_ID="your_access_key"
R2_SECRET_ACCESS_KEY="your_secret_key"
R2_BUCKET_NAME="vac-ncc-document"
R2_PUBLIC_URL="https://pub-xxxxxx.r2.dev"
```
Start the backend development server:
```bash
npm run dev
```

### 4. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
```
Start the Vite development server:
```bash
npm run dev
```

---

## 📁 Project Structure

```text
VAC_NCC/
├── backend/                  # Express.js Server
│   ├── controllers/          # Business logic for auth, admin, student, system, settings
│   ├── middleware/           # JWT verification and Multer upload middleware
│   ├── models/               # MongoDB Schemas (Admin, VacStudent, Scores, SystemSettings, AuditLog)
│   ├── routes/               # API endpoint routing
│   ├── server.js             # Main application entry point
│   └── .env                  # Environment variables (Ignored in Git)
│
└── frontend/                 # React UI
    ├── src/
    │   ├── components/       # Reusable UI components (Navbar, Flash Messages, Dashboards)
    │   ├── context/          # React Context (UIContext for global loader/flash states)
    │   ├── pages/            # Main views (AdminDashboard, StudentDashboard, Logins)
    │   ├── App.jsx           # Main React Router configuration
    │   └── index.css         # Global stylesheets and media queries
    └── package.json
```

---

## 🔒 Security Measures
* Passwords are securely hashed using **bcryptjs** before being stored in the database.
* API endpoints are protected using **JSON Web Tokens (JWT)**.
* Granular **Role-Based Access Control (RBAC)** ensures admins cannot access or modify unauthorized modules.
* Destructive actions (like Database Resets) require multi-factor verification (specific string typing + re-entering password).
* Git tracking explicitly ignores `.env` files and `uploads/` directories to prevent credential leaks.
* Student registration checks for database existence to prevent unauthorized accounts.
