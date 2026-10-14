# StudyMate — Digital Study Group Finder
### Full-Stack MERN Academic Collaboration Platform

StudyMate is a production-minded academic collaboration web application built on the MERN stack (MongoDB, Express, React, Node.js). It empowers university students to discover, create, and join study groups, schedule study sessions, share course notes and materials, and communicate in real-time through Socket.IO.

---

## 🚀 Key Features

* **Authentication & Authorization**: Secure signup, login, session validation using JWT stored in HTTP-only cookies, password hashing with bcrypt, role-based controls, and resource ownership checks.
* **Study Group Discovery (`/groups`)**: Full-text keyword search across titles and subjects, multi-filter by skill level, location, and department, responsive sorting, and pagination.
* **Group Creation (`/groups/create`)**: Multi-day scheduling picker, capacity limits, academic restrictions, live preview card, and instant database creation.
* **Group Details (`/groups/:groupId`)**: Member directories, upcoming sessions, shared resources, and join/leave controls with capacity enforcement.
* **Personalized Dashboard (`/dashboard`)**: Live counts calculated from MongoDB, upcoming study sessions, recent resources, and recommended groups.
* **Study Sessions (`/sessions`)**: Schedule collaborative meetings with location, start/end time validation, Google Meet links, and cancellation controls.
* **Study Materials (`/materials`)**: Secure file uploads (PDF, DOCX, PPTX, TXT up to 15MB) with unique server-generated filenames, metadata tracking, and permission-validated downloads.
* **Real-Time Group Discussions (`/messages`)**: Real-time room messaging powered by Socket.IO with connection status indicators, persistent message history in MongoDB, and authorization protection.
* **Profile & Settings (`/profile`, `/settings`)**: Edit academic details, update preferences, change passwords with current-password verification, and account deletion workflows.
* **White-Screen Prevention**: Global React ErrorBoundary, route guards, loading states, and case-sensitive file naming.

---

## 🛠️ Technology Stack & Requirements

* **Node.js**: Node.js 20 LTS (Baseline: v20.20+)
* **Database**: MongoDB (Local server or MongoDB Atlas connection string)
* **Backend**: Express 4, Mongoose 8, Socket.IO 4, Zod 3, Multer, Helmet, CORS, Cookie-Parser, Bcryptjs, JsonWebToken, Jest, Supertest
* **Frontend**: React 19, Vite 8, Tailwind CSS, React Router DOM 7, Lucide React, Axios, Socket.IO Client

---

## 📦 Project Structure

```text
digital-study-group-finder/
├── package.json               # Frontend dependencies & scripts
├── package-lock.json          # Pinned frontend lockfile
├── vite.config.js             # Vite configuration with API & Socket proxy
├── .env.example               # Frontend environment template
├── .env                       # Frontend environment configuration
├── dist/                      # Production frontend build assets
├── src/
│   ├── main.jsx               # Application entrypoint
│   ├── App.jsx                # Router, ErrorBoundary, AuthProvider
│   ├── index.css              # Global styling & Tailwind imports
│   ├── context/
│   │   └── AuthContext.jsx    # React Authentication Context & useAuth hook
│   ├── layouts/
│   │   └── DashboardLayout.jsx# Reusable responsive navigation layout
│   ├── components/
│   │   ├── ErrorBoundary.jsx  # Global React Error Boundary
│   │   └── ProtectedRoute.jsx # Route guards for auth and public routes
│   ├── services/
│   │   ├── api.js             # Axios client with centralized endpoints
│   │   └── socket.js          # Socket.IO client instance & helpers
│   └── pages/
│       ├── Home.jsx           # Public landing page with live statistics
│       ├── Login.jsx          # Login form with validation & redirects
│       ├── Register.jsx       # Registration with academic departments
│       ├── Dashboard.jsx      # Personalized student dashboard
│       ├── FindGroups.jsx     # Group discovery, search, filters & join
│       ├── CreateGroup.jsx    # Group creation with live preview
│       ├── GroupDetails.jsx   # Group members, sessions & resources
│       ├── MyGroups.jsx       # Joined & administered study groups
│       ├── StudySessions.jsx  # Session planner & meeting scheduler
│       ├── StudyMaterials.jsx # Resource uploader & authorized downloads
│       ├── Messages.jsx       # Socket.IO real-time group chat
│       ├── Profile.jsx        # Academic profile view & edit
│       ├── Settings.jsx       # Preferences & password management
│       └── NotFound.jsx       # 404 fallback page
└── server/
    ├── package.json           # Backend pinned dependencies & scripts
    ├── package-lock.json      # Backend lockfile
    ├── .env.example           # Backend environment template
    ├── .env                   # Backend environment configuration
    ├── uploads/               # Storage directory for shared study files
    ├── tests/
    │   └── api.test.js        # Automated API test suite with Jest & Supertest
    └── src/
        ├── app.js             # Express app setup, security & routes
        ├── server.js          # HTTP & Socket.IO server entrypoint
        ├── config/
        │   └── db.js          # Resilient MongoDB connection handler
        ├── models/            # Mongoose schemas (User, StudyGroup, Session, etc.)
        ├── controllers/       # API controllers (auth, groups, sessions, etc.)
        ├── middleware/        # auth, validate, upload, errorHandler
        ├── validators/        # Zod request validation schemas
        ├── routes/            # Express routers under /api/v1
        ├── sockets/           # Socket.IO authentication & room handlers
        └── scripts/
            └── seed.js        # Development database seeder
```

---

## ⚙️ Installation & Setup Guide

### 1. Prerequisites

Ensure you have **Node.js 20 LTS** installed:
```bash
node -v   # Should output v20.x.x
npm -v    # Should output 10.x.x or higher
```

Ensure **MongoDB** is running locally (`mongodb://127.0.0.1:27017`) or have a **MongoDB Atlas** connection string ready.

---

### 2. Configure Environment Variables

#### Backend Configuration:
Create `server/.env` (or use `server/.env.example` as a template):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/studymate
JWT_SECRET=super_secret_studymate_development_key_change_in_production_987654321
CLIENT_URL=http://localhost:5173
COOKIE_SECURE=false
UPLOAD_DIR=uploads
```

#### Frontend Configuration:
Create `.env` in the root directory:
```env
VITE_API_BASE_URL=/api/v1
```

---

### 3. Install Dependencies

#### Install Frontend Dependencies:
From the root project folder:
```bash
npm install
```

#### Install Backend Dependencies:
From the `server` directory:
```bash
cd server
npm install
cd ..
```

---

### 4. Seed Demo Data (Optional for Development)

Populate the database with realistic demo accounts, study groups, sessions, materials, and discussion messages:
```bash
cd server
npm run seed
cd ..
```

#### Demo User Credentials:
| Name | Email | Password | Role | Department |
| :--- | :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@studymate.internal` | `Password123!` | `admin` | Administration (Staff) |
| **Vijay Kumar** | `vijay@example.com` | `Password123!` | `student` | MCA (2nd Sem) |
| **Priya Sharma** | `priya@example.com` | `Password123!` | `student` | MCA (2nd Sem) |
| **Arun Kumar** | `arun@example.com` | `Password123!` | `student` | B.Tech (4th Sem) |
| **Rahul Verma** | `rahul@example.com` | `Password123!` | `student` | BCA (3rd Sem) |

---

### 5. Running the Application

Open two terminal windows:

#### Terminal 1 — Start the Backend API & Socket Server:
```bash
cd server
npm start
```
* Backend starts at `http://localhost:5000`
* Health check: `http://localhost:5000/api/health`

#### Terminal 2 — Start the Frontend Dev Server:
```bash
npm run dev
```
* Vite will launch at `http://localhost:5173`
* Student portal: `http://localhost:5173`
* Administrator login: `http://localhost:5173/admin/login`

Open your browser to `http://localhost:5173`.

---

## 🛡️ Administrator Authentication & Administration System

StudyMate includes an enterprise-grade, secure platform administration system operating over a dedicated `/admin` frontend interface and backend `/api/v1/admin` namespace.

### 1. Key Administrative Features & Routes

| Frontend Route | Purpose & Capabilities |
| :--- | :--- |
| `/admin/login` | Dedicated security-themed admin portal with rate limiting, brute-force defense, and generic 401 messaging. |
| `/admin/dashboard` | Real-time platform KPI statistics, live user/group/storage volume metrics, activity charts, and recent audit logs. |
| `/admin/users` | Paginated directory, search by name/email, account suspension with custom reason & auto-expiration, role toggling, last-admin lockout prevention. |
| `/admin/groups` | Platform-wide group supervision, status moderation (`active`, `hidden`, `archived`, `suspended`), reason tracking, cascade deletion. |
| `/admin/sessions` | Overview of all academic study sessions, cancellation with mandatory reason, status filtering. |
| `/admin/materials` | Uploaded resource explorer, quarantine, restore, permanent disk deletion, secure authorized downloads with path traversal defenses. |
| `/admin/messages` | Contextual investigation of reported community chats, surrounding message inspections, soft-deletion. |
| `/admin/reports` | Unified moderation desk handling reports across users, groups, sessions, materials, and messages. Assignment, status transitions (`pending`, `under_review`, `resolved`, `dismissed`), resolution reason recording. |
| `/admin/activity-logs`| Searchable, filterable append-only audit trail logging administrative actions, actors, IP addresses, targets, and sanitized metadata. |
| `/admin/settings` | Dynamic platform governance toggles (Maintenance Mode, Student Registration, Study Group Creation, Material Uploads, Max File Size, Global Announcement Banner). |
| `/admin/profile` | Administrator account overview, contact information updates, and secure password changes requiring current password verification. |

---

### 2. Secure Initial-Admin Provisioning (CLI)

To ensure bank-grade security, **no public administrator registration endpoint exists**. Administrators cannot be provisioned through self-signup or frontend manipulation.

An idempotent, controlled CLI bootstrap tool is provided in `server/src/scripts/createAdmin.js`:

#### Option A: Interactive Command Prompt
From the `server` directory, run:
```powershell
npm run create-admin
```
You will be safely prompted for:
1. Administrator Full Name
2. Email Address (validated)
3. Password (securely hidden/masked, minimum 8 characters, must contain letters and numbers)

#### Option B: Non-Interactive Script Flags
```powershell
node src/scripts/createAdmin.js --name "Admin Name" --email "admin@university.edu" --password "StrongPass123!"
```

#### Option C: Promote an Existing User
If a student or verified user already exists, promote them idempotently:
```powershell
node src/scripts/createAdmin.js --email "existing.user@example.com" --promote
```

**Security Safeguards in CLI Provisioning:**
- Passwords are salted and hashed with `bcryptjs`.
- Protects against accidental overwrites: Will not reset existing administrator passwords unless explicitly requested.
- Logs the provisioning event to the persistent Audit Log (`ADMIN_BOOTSTRAP` action) with zero secrets leaked.

---

### 3. Role-Based Access Control (RBAC) Architecture

- **`student`**: Default user role. Permitted to access student portal (`/dashboard`, `/groups`, `/sessions`, `/materials`, `/messages`, `/reports`).
- **`admin`**: Platform administrator. Has unrestricted administrative oversight across all academic resources.
- **Group Owner / Moderator**: Resource-specific ownership scoped strictly to individual study groups. Distinct from platform administrators. Group moderators cannot access any `/admin/*` route or API.

#### Security & Authorization Boundaries:
- **Server-Side Enforcement**: All administrative operations require `protect` (JWT validation & suspension check) followed by `requireAdmin` middleware. If a non-admin attempts access, the API returns **HTTP 403 Forbidden**.
- **Suspension Enforcement**: Suspended users are immediately denied access on all protected requests. If a suspension has a defined `suspendedUntil` timestamp that has passed, the account is automatically reactivated upon next authentication check.
- **Self-Lockout & Last-Admin Protection**: An administrator cannot suspend their own account, demote their own role, or delete themselves. The system guarantees at least one active administrator remains at all times.
- **Maintenance Mode Enforcement**: When maintenance mode is activated via Admin Settings, non-admin API requests are blocked with HTTP 503 (`PLATFORM_MAINTENANCE`), while administrators retain full access to restore operations.

---

### 4. Administrator REST API Catalog

All administrative routes are mounted under `/api/v1/admin`:

```text
POST   /api/v1/admin/auth/login            # Administrator authentication with rate limiting
GET    /api/v1/admin/auth/me               # Verify current admin session
POST   /api/v1/admin/auth/logout           # Invalidate admin session & clear cookie

GET    /api/v1/admin/stats                 # High-level platform KPIs & storage calculations
GET    /api/v1/admin/users                 # Search & paginated user directory
GET    /api/v1/admin/users/:id             # User profile, platform activity & memberships
PATCH  /api/v1/admin/users/:id/status      # Suspend or reactivate user account (with reason)
PATCH  /api/v1/admin/users/:id/role        # Update user role (with last-admin guard)
DELETE /api/v1/admin/users/:id             # Delete user account with relationship cleanup

GET    /api/v1/admin/groups                # Filterable study group directory
GET    /api/v1/admin/groups/:id            # Detailed group profile with members and sessions
PATCH  /api/v1/admin/groups/:id/status     # Moderate status (active, hidden, archived, suspended)
DELETE /api/v1/admin/groups/:id            # Cascade delete group, memberships, and sessions

GET    /api/v1/admin/sessions              # List and filter study sessions
PATCH  /api/v1/admin/sessions/:id/cancel   # Cancel session with reason
DELETE /api/v1/admin/sessions/:id          # Administrative session deletion

GET    /api/v1/admin/materials             # Query study materials by uploader/group/status
PATCH  /api/v1/admin/materials/:id/status  # Quarantine or restore material
GET    /api/v1/admin/materials/:id/download# Safe admin file download
DELETE /api/v1/admin/materials/:id         # Remove material record and disk file

GET    /api/v1/admin/messages/reported     # Fetch reported messages
GET    /api/v1/admin/messages/:id/context  # Retrieve surrounding conversation context
PATCH  /api/v1/admin/messages/:id/status   # Soft-delete or restore message

GET    /api/v1/admin/reports               # Moderation ticket queue
GET    /api/v1/admin/reports/:id           # Full investigation context
PATCH  /api/v1/admin/reports/:id           # Assign moderator, update status & notes
POST   /api/v1/reports                     # Student report submission endpoint

GET    /api/v1/admin/audit-logs            # Paginated append-only audit trail
GET    /api/v1/admin/settings              # Platform governance settings
PATCH  /api/v1/admin/settings              # Update platform settings
GET    /api/v1/admin/profile               # Administrator profile
PATCH  /api/v1/admin/profile               # Update name/bio
PATCH  /api/v1/admin/profile/password      # Change password with current-password verification
```

---

### 5. Audit Logging Specifications

All security-sensitive operations trigger an asynchronous, append-only record in the `AuditLog` collection:
- **Logged Events**: Admin logins/logouts, user suspensions/reactivations, role alterations, group status modifications, material quarantines, report resolutions, and platform settings updates.
- **Sanitization Guarantee**: User passwords, JWT secrets, authentication cookies, and private message payloads are completely excluded from audit metadata.
- **Integrity Boundary**: The audit trail is write-only from the application layer. Endpoints allow searching and filtering (`/api/v1/admin/audit-logs`), but no route exists to modify or delete logs.

---

## 🧪 Running Automated Tests

To run the full automated test suite (including all student API tests and the complete administrative security & RBAC suite):
```powershell
cd server
npm test
```

**Test Coverage Summary:**
- **`tests/api.test.js`**: Student registration, login, profile updates, study group creation, join/leave limits, study sessions, real-time messaging, and error boundaries.
- **`tests/admin.test.js`**: Admin login, invalid credentials rejection, rate limiting, student access rejection (HTTP 403), platform statistics aggregation, account suspension enforcement, report submission & resolution workflows, platform settings updates, and last-admin lockout prevention.

To verify the frontend production build:
```powershell
npm run build
```

---

## 🔧 Troubleshooting Common Issues

### 1. Blank White Screen
* **Cause**: Case sensitivity mismatch in page imports or unhandled React errors.
* **Resolution**: All page imports are properly cased (e.g. `Home.jsx`, `AdminDashboard.jsx`). The application includes a top-level `<ErrorBoundary>` in `App.jsx` that catches any runtime exceptions and renders a helpful fallback screen with a retry button instead of a white page.

### 2. Cannot Connect to MongoDB
* **Check local MongoDB service**:
  ```powershell
  Get-Service *mongo*
  ```
  If stopped, start it:
  ```powershell
  Start-Service MongoDB
  ```
* **Using MongoDB Atlas**: Update `MONGODB_URI` in `server/.env` to your cloud connection string:
  ```env
  MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/studymate?retryWrites=true&w=majority
  ```

### 3. API Requests Return 404 or Network Error
* Make sure `server` is running on port 5000 (`http://localhost:5000/api/health`).
* The Vite dev server proxies `/api` and `/socket.io` to `http://localhost:5000` via `vite.config.js`.

### 4. Admin Access Denied (HTTP 403)
* If your student account navigates to `/admin/*`, you will see the 403 Access Denied screen and be redirected.
* Ensure you sign in through `/admin/login` using an administrator account (e.g., `admin@studymate.internal` or one created with `npm run create-admin`).

### 5. File Upload Issues
* Ensure the `server/uploads` directory exists (it is automatically created upon server boot or upload).
* Max allowed file size is 15MB (or the limit dynamically configured in Admin Settings). Permitted extensions: `.pdf`, `.doc`, `.docx`, `.ppt`, `.pptx`, `.txt`.

---

## 📄 License
Academic and Educational project created for StudyMate Digital Study Group Finder.
