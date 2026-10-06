# VAC NCC Portal 🎖️

A comprehensive, full-stack Value Added Course (VAC) Management Portal designed for Assam University students taking the NCC curriculum. Built on the **MERN** stack (MongoDB, Express, React, Node.js), this portal digitizes the entire student evaluation process—from bulk CSV registrations and live test engines to Cloudflare-powered study material distribution.

---

## ✨ Key Features

This portal is strictly segregated into two core experiences: The Admin Interface (for faculty/CTOs) and the Student Dashboard (for candidates).

### 👨‍💼 Admin Features
* **Role-Based Access Control (RBAC):** The 'Lead Admin' can dynamically assign specific modules to other admins (e.g., CTOs). Sub-admins will only see the sections of the portal they are authorized to access.
* **Intelligent Test Scheduling:** Admins can set Test Windows (Date, Start Time, End Time). These schedules are instantly pushed to the database and cleanly formatted into human-readable 12-hour AM/PM schedules on the student's dashboard.
* **Strict Test Activation & Cancellation:** Total control over live exams. The portal separates "Scheduling" from "Activating". Admins must manually activate a test to unlock it for students, preventing premature access. Tests can also be explicitly "Canceled" with a custom admin reason seamlessly displayed in the UI.
* **Automated Master Records (Best of 2):** The system automatically compiles all records and dynamically calculates final grades. It specifically calculates the Internal Score (Int-Score) by automatically picking the "Best 2 out of 3" internal tests.
* **Finalize & Publish:** A dedicated Finalize button locks the test phase, prevents further submissions, and instantly publishes the results (or generic "Results Published" status depending on settings) to the students.
* **Bulk Data Upload (CSV):** Automatically process and store thousands of student records and test question banks via simple, error-handled CSV uploads.
* **Hybrid Question Bank Manager (CRUD + Bulk):** A 3-pillar management system that empowers admins to fully control the question database. It includes a real-time table UI for surgical inline edits/deletions, a powerful "Append" bulk-upload mode, and a one-click "Replace All" nuclear option for uploading fresh semester data via CSV.
* **Global Settings & Broadcasts:** Admins can pin live broadcast messages across the student portal in real time.
* **Immutable Audit Logs & Database Reset:** The Lead Admin has access to highly secure, password-protected database reset tools (Nuclear Reset) to clear data for new batches, backed by an immutable Audit Log.

### 🎓 Student Features
* **Verified Registration System:** Students can only register and access the portal if their exact `vac_rollNo` was pre-authorized and uploaded by an admin.
* **Interactive "Branch" Dashboard:** A beautiful, responsive, mobile-first UI featuring separate tabs for **Online-Test**, **Practical-Test**, and **Continuous Assessment**. 
* **Dynamic Status Cards:** The dashboard elegantly branches into sub-components (Internal 1, 2, 3), dynamically reacting to admin configurations (e.g., "Not Scheduled Yet", "Scheduled: 10:00 AM - 11:30 AM", "LIVE", "Canceled", or "Results Published").
* **Secure Live Test Engine:** When a test is active, students enter a secure Live Test mode featuring a sticky countdown timer. The backend strips correct answers from the network requests to prevent cheating, and auto-submits exactly when the timer hits zero.
* **Utility Profile Menu:** Students can pull up their digital **VAC Identity Card**, view the entire **Syllabus**, download study material from a **5-Unit Notes Modal**, and contact the lead developer via a **Technical Support Modal**.
* **Profile Onboarding:** First-time logins require the student to complete a mandatory, clean onboarding flow (demographics, contact info, etc.) before gaining dashboard access.
* **Self-Service Password Reset (Zero-Cost):** Students can securely reset forgotten passwords using their pre-onboarded Category and Date of Birth as internal security questions, bypassing the need for expensive third-party Email/SMS OTP services.

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

## 🔒 Security Measures
* Passwords are securely hashed using **bcryptjs** before being stored in the database.
* API endpoints are protected using **JSON Web Tokens (JWT)**.
* Granular **Role-Based Access Control (RBAC)** ensures admins cannot access or modify unauthorized modules.
* Destructive actions (like Database Resets) require multi-factor verification (specific string typing + re-entering password).
* During Live Tests, the backend strips `correctOption` from payloads before transmitting to the client to prevent network-sniffing exploits.
* Student registration checks for database existence to prevent unauthorized accounts.
