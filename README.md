# VAC NCC Portal 🎖️

A comprehensive, full-stack Value Added Course (VAC) Management Portal designed for Assam University students taking the NCC curriculum. Built on the **MERN** stack (MongoDB, Express, React, Node.js), this portal digitizes the entire student evaluation process—from bulk CSV registrations and live test engines to Cloudflare-powered study material distribution.

---

## 👥 Two Kinds of Users

This portal is built for two distinct user roles, each with their own specialized interface, security clearance, and set of features.

### 1. Admin Users (Lead Admin & Sub-Admins)
Administrators manage the portal, configure exams, evaluate students, and oversee system operations.
* **Role-Based Access Control (RBAC):** The 'Lead Admin' can dynamically assign specific modules to other admins (e.g., CTOs). Sub-admins will only see the sections of the portal they are authorized to access.
* **Test & Evaluation Management:** Admins can configure test dates, timings, and cut-off marks. They manage the flow of the evaluation phases (Internal 1, 2, 3, Practical, and Continuous Assessment).
* **Live Test Engine configuration:** Admins upload questions via CSV, and activate the "Live Test" windows for students.
* **Master Records:** Automatically compile and calculate final grades based on uploaded test and attendance data, allowing admins to search, filter, and track student performance globally.
* **Bulk Data Upload (CSV):** Automatically process and store thousands of student records and test scores via simple CSV uploads.
* **Global Settings & Broadcasts:** Admins can pin live broadcast messages across the student portal.
* **Database Reset Options:** The Lead Admin has access to highly secure, password-protected database reset tools (Nuclear Reset) to clear data for new batches, backed by an immutable Audit Log.

### 2. VAC_Student Users
Students are the end-users who consume course material, take tests, and view their evaluations.
* **Verified Registration:** Students can only register if their `vac_rollNo` was pre-authorized by an admin via CSV upload.
* **Interactive "Branch" Dashboard:** A beautiful, mobile-first UI featuring separate tabs for **Online-Test**, **Practical-Test**, and **Continuous Assessment**. Each tab branches into its sub-components (Internal 1, 2, 3), dynamically reacting to admin schedules.
* **Live Test Engine:** When a test is active, students enter a secure Live Test mode featuring a sticky countdown timer. The backend strips correct answers from the network requests to prevent cheating, and auto-submits when the timer hits zero.
* **Utility Profile Menu:** Students can pull up their digital **VAC Identity Card**, view the entire **Syllabus**, download study material from a **5-Unit Notes Modal**, and contact the lead developer via a **Technical Support Modal**.
* **Profile Onboarding:** First-time logins require the student to complete a mandatory onboarding form (demographics, contact info, etc.).

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
