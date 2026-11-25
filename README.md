# VAC NCC Portal 🎖️

A comprehensive, full-stack Value Added Course (VAC) Management Portal designed for Assam University students taking the NCC curriculum. Built on the **MERN** stack (MongoDB, Express, React, Node.js), this portal digitizes the entire student evaluation process—from bulk CSV registrations and CBT-style live test engines to Cloudflare-powered study material distribution.

---

## ✨ Key Features

This portal is strictly segregated into two core experiences: The Admin Interface (for faculty/CTOs) and the Student Dashboard (for candidates).

### 👨‍💼 Admin Features
* **Role-Based Access Control (RBAC):** The 'Lead Admin' can dynamically assign specific modules to other admins (e.g., CTOs). Sub-admins will only see the sections of the portal they are authorized to access.
* **Intelligent Test Scheduling:** Admins can set Test Windows (Date, Start Time, End Time). These schedules are instantly pushed to the database and cleanly formatted into human-readable 12-hour AM/PM schedules on the student's dashboard.
* **Strict Test Activation & Cancellation:** Total control over live exams. The portal separates "Scheduling" from "Activating". Admins must manually activate a test to unlock it for students, preventing premature access. Tests can also be explicitly "Canceled" with a custom admin reason seamlessly displayed in the UI.
* **Live Score Sync & Auto-Polling:** Real-time visibility into student submissions during active exams. The admin dashboard polls every 5 seconds for live submission records, displaying student scores and attendance directly with instant manual sync capabilities.
* **Automated Master Records (Best of 2):** The system automatically compiles all records and dynamically calculates final grades. It specifically calculates the Internal Score (Int-Score) by automatically picking the "Best 2 out of 3" internal tests.
* **Finalize & Publish:** A dedicated Finalize button locks the test phase, prevents further submissions, and instantly publishes the results to the students.
* **Bulk Data Upload (CSV):** Automatically process and store thousands of student records and test question banks via simple, error-handled CSV uploads.
* **Hybrid Question Bank Manager (CRUD + Bulk):** A 3-pillar management system that empowers admins to fully control the question database. It includes a real-time table UI for surgical inline edits/deletions, a powerful "Append" bulk-upload mode, and a one-click "Replace All" nuclear option for uploading fresh semester data via CSV.
* **Targeted Global Broadcasts:** Admins can pin targeted broadcast messages dynamically to specific pages (Home Page, Dashboard, or Live Test Page) using a centralized `BroadcastBanner` component.
* **Comprehensive Document Exports (CSV & PDF):** The portal generates beautifully formatted records. Admins can instantly download robust PDF reports mirroring the on-screen table or export Transparency CSV files mapping students' raw answers directly to clean A, B, C, D formats for effortless OMR-style processing.
* **Dynamic Bulk-Manual Registrations:** Seamlessly bridges the gap between massive CSV uploads and single-entry additions. The "Add Manually" tool allows admins to rapidly inject small batches of late-arriving students into the whitelist using a dynamic, multi-row modal that safely bulk-inserts to the database with a single click.
* **Interactive Data Sorting (Leaderboards):** The admin portal features dynamic 1-click sorting across all live test tables and the Master Table. Clicking any Score or Total column instantly ranks students, providing real-time leaderboards and immediate visibility into bottom performers.
* **Immutable Audit Logs & Database Reset:** The Lead Admin has access to highly secure, password-protected database reset tools (Nuclear Reset) to clear data for new batches, backed by an immutable Audit Log.
* **Geofenced Class Management (GPS Verification):** Admins can schedule Physical and Virtual classes. For physical classes, they can trigger a "Live Attendance Window", securely tracking students via the Haversine formula to ensure they are physically present within a 5-meter radius of the classroom.
* **Auto-Calculated Continuous Assessment (CA):** A 1-click magic button automatically tallies the Geofenced attendance records for all students across the semester and perfectly applies the university grading rules (e.g., >85% = 5 marks) directly into the CA Master Table.

### 🎓 Student Features
* **Verified Registration System:** Students can only register and access the portal if their exact `vac_rollNo` was pre-authorized and uploaded by an admin.
* **Interactive "Branch" Dashboard:** A beautiful, responsive, mobile-first UI featuring separate tabs for **Online-Test**, **Practical-Test**, and **Continuous Assessment**. 
* **Dynamic Status Cards:** The dashboard elegantly branches into sub-components (Internal 1, 2, 3), dynamically reacting to admin configurations (e.g., "Not Scheduled Yet", "Scheduled: 10:00 AM - 11:30 AM", "LIVE", "Canceled", "Test Submitted. Awaiting Admin Finalization", or "Results Published").
* **Single-Question CBT Test Engine:** Modern Computer-Based Test (CBT) interface displaying one question at a time alongside a responsive **Question Track Box** showing live status for every question:
  * 🔵 **Blue:** Currently active question
  * 🟢 **Green:** Attempted question
  * 🔴 **Red:** Skipped / visited but unanswered question
  * ⚪ **Grey:** Untouched question
* **Strict Anti-Cheating System:** Multi-event tab-switch and blur detection with a 1-warning grace buffer (Violation 1: Warning modal; Violation 2: Immediate auto-submission to lock the exam).
* **High-Concurrency Submission Safeguards:** Auto-submit jitter (0–2.5s) prevents server spikes when the exam timer hits zero. Submissions utilize `keepalive` requests to ensure zero dropped packets during mobile backgrounding.
* **Single Source of Truth:** Submission status is strictly enforced and verified by MongoDB on the backend, preventing phantom localStorage cache glitches and duplicate test attempts.
* **Utility Profile Menu:** Students can pull up their digital **VAC Identity Card**, view the entire **Syllabus**, download study material from a **5-Unit Notes Modal**, and contact the lead developer via a **Technical Support Modal**.
* **Profile Onboarding:** First-time logins require the student to complete a mandatory, clean onboarding flow (demographics, contact info, etc.) before gaining dashboard access.
* **Self-Service Password Reset (Zero-Cost):** Students can securely reset forgotten passwords using their pre-onboarded Category and Date of Birth as internal security questions, bypassing the need for expensive third-party Email/SMS OTP services.
* **Live Geofenced Attendance:** A dedicated "Classes & Attendance" tab allows students to securely mark their attendance in real-time. The portal utilizes the HTML5 Geolocation API, mathematically verifying their physical distance to the classroom and instantly blocking attempts to mark attendance from dorms or off-campus.

---

## 🛠️ Technology Stack & Infrastructure

* **Frontend:** 
  * React.js (Vite)
  * React Router DOM
  * Mobile-first responsive CSS
* **Backend:** 
  * Node.js & Express.js
  * Serverless functions deployed on **Vercel Mumbai (`bom1`)** for sub-10ms database proximity
* **Database:** 
  * MongoDB Atlas (**Mumbai `ap-south-1`** region)
  * Mongoose with connection pooling (`maxPoolSize: 20`, `minPoolSize: 5`)
* **Authentication & Security:** 
  * JSON Web Tokens (JWT) 
  * bcryptjs (Password Hashing)
  * Secure `.env`-based credential management with `.gitignore` protection
* **File Storage (CDN):** 
  * Cloudflare R2 via `@aws-sdk/client-s3`
* **Data Processing & Exports:** 
  * Multer (File uploads)
  * `csv-parser` (Bulk data ingestion)
  * jsPDF & autoTable (Dynamic client-side PDF generation)

---

## 🚀 Installation & Setup

### 1. Prerequisites
Ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v18+)
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
Create a `.env` file in the `/backend` directory:
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

# Admin Initial Seed Credentials (Ignored by Git)
ADMIN_LEAD_USERNAME="Raza Alam"
ADMIN_LEAD_PASSWORD="your_secure_password"
ADMIN_CTO_MAAM_USERNAME="Deepshikha Bhattacharjee"
ADMIN_CTO_MAAM_PASSWORD="your_secure_password"
ADMIN_CTO_SIR_USERNAME="Sangharsh Mishra"
ADMIN_CTO_SIR_PASSWORD="your_secure_password"
```

To seed the initial admin accounts safely:
```bash
node seed.js
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

To build for production:
```bash
npm run build
```

---

## 🔒 Security & Git Hygiene Measures
* **Zero Credential Exposure:** All database strings, secrets, and admin initial passwords reside in `.env` and `seed.js`, which are strictly ignored by the centralized root `.gitignore`.
* **Database as Single Source of Truth:** Test submission validation is enforced at the controller level; client-side localStorage flags do not determine exam access.
* **Anti-Sniffing Question Payloads:** During Live Tests, the backend strips `correctOption` from question queries before sending to client devices.
* **Region Co-location:** Vercel functions (`bom1`) and MongoDB Atlas (`ap-south-1`) share the same geographical zone to optimize latency and eliminate timeouts.
