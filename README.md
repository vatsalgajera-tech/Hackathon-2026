# VendorBridge AI — Smart Procurement ERP

> AI-powered procurement and vendor management platform built for modern enterprises. Streamline the entire procurement lifecycle — from vendor onboarding and RFQs through quotation comparison, approval workflows, purchase orders, and invoice management.

---

## 🚀 Features

### 🏢 Vendor Management
- Register and manage a complete vendor directory with company profiles
- Categorize vendors (IT & Software, Hardware, Office Supplies, Logistics, Consulting, Manufacturing)
- Track vendor ratings, completed orders, delayed orders, and rejection history
- AI-powered **vendor risk scoring** based on performance metrics
- Filter, search, and view detailed vendor profiles
- Edit and delete vendors with confirmation dialogs

### 📋 RFQ (Request for Quotation) Management
- Create RFQs with line items (name, quantity, unit, estimated price)
- Assign multiple vendors to each RFQ
- Set deadlines and track RFQ status: `open` → `under_review` → `awarded` / `cancelled`
- View RFQ details inline with expandable panels
- Edit and delete RFQs

### 📄 Quotation Management
- Vendors submit quotations against open RFQs
- Track per-item pricing with unit price and totals
- Quotation statuses: `submitted`, `under_review`, `accepted`, `rejected`, `expired`
- View all quotations with filtering by status

### 🏆 AI Quotation Comparison
- Side-by-side comparison of all quotations received for an RFQ
- **AI scoring engine** ranks vendors on:
  - Price competitiveness
  - Delivery speed
  - Vendor rating and reliability
  - Historical performance (delays, rejections)
- Auto-recommend the best vendor with justification
- Accept a quotation directly to auto-create a Purchase Order
- Sort by overall score, price, or delivery time

### ✅ Approval Workflow
- Multi-stage approval pipeline: `Quotation Submitted → Under Review → Manager Approval → Decision Made`
- Pending/Approved/Rejected stats sourced from live API data
- Managers can approve or reject with remarks
- Rejection reason captured and stored for audit trail
- Real-time badge count on Pending tab

### 🛒 Purchase Orders
- Auto-generated from accepted quotations
- PO statuses: `pending`, `confirmed`, `dispatched`, `delivered`, `cancelled`
- View PO details with vendor info, line items, subtotal, tax, and total
- Filter by status, search by PO number or vendor

### 🧾 Invoice Management
- Create invoices linked to Purchase Orders
- Invoice statuses: `draft`, `sent`, `paid`, `overdue`, `cancelled`
- Clean printable invoice layout with itemized breakdown, GST, and grand total
- No email/print functionality — view-only professional invoice document

### 📊 Dashboard
- At-a-glance stats: Active Vendors, Open RFQs, Pending Approvals, Total PO Value
- Live counts from API — no hardcoded demo data
- Recent RFQ and Quotation activity feed
- Procurement health overview

### 📈 Reports & Analytics
- Visual summaries of procurement activity
- Vendor performance breakdowns
- Spending analytics across categories

### 📝 Activity Logs
- System-wide audit trail of all procurement events
- Timestamped records for compliance and review

---

## 👥 Roles & Permissions

| Role | Access |
|------|--------|
| **Admin** | Full access to all modules |
| **Manager** | Approvals, RFQs, Quotations, POs, Invoices, Reports |
| **Procurement Officer** | Vendors, RFQs, Quotations, POs, Invoices, Activity |
| **Vendor** | Dashboard, RFQs (view), Quotations, POs (view), Invoices (view) |

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `vatsal@gmail.com` | `vatsal123` |
| Manager | `prince@gmail.com` | `prince123` |
| Procurement Officer | `yash@gmail.com` | `yash123` |
| Vendor | `neil@gmail.com` | `neil123` |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **React Router v6** | Client-side routing |
| **Vite** | Build tool & dev server |
| **Lucide React** | Icon library |
| **React Hot Toast** | Notifications |
| **Vanilla CSS** | Custom design system with dark/light theme |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express** | REST API server |
| **MongoDB + Mongoose** | Database & ODM |
| **bcryptjs** | Password hashing |
| **JSON Web Token (JWT)** | Authentication |
| **dotenvx** | Environment management |

---

## 📁 Project Structure

```
Hackathon-2026/
├── client/                        # React frontend (Vite)
│   ├── public/
│   │   ├── favicon.svg            # App icon
│   │   ├── favicon.jpg            # Logo (globe wireframe)
│   │   └── logo.jpg               # Full brand logo
│   └── src/
│       ├── components/
│       │   ├── ConfirmDialog/     # Reusable blur backdrop confirm modal
│       │   └── Layout/            # Sidebar + Header layout shell
│       ├── context/
│       │   ├── AuthContext.jsx    # JWT auth state
│       │   └── ThemeContext.jsx   # Dark/light theme toggle
│       ├── pages/
│       │   ├── Auth/              # Login & Signup
│       │   ├── Dashboard/         # Overview stats & activity
│       │   ├── Vendors/           # Vendor CRUD
│       │   ├── RFQ/               # RFQ management
│       │   ├── Quotations/        # Quotation list + AI compare
│       │   ├── Approvals/         # Approval workflow
│       │   ├── PurchaseOrders/    # PO management
│       │   ├── Invoices/          # Invoice management
│       │   ├── Activity/          # Audit log
│       │   └── Reports/           # Analytics
│       ├── services/
│       │   └── api.js             # Axios instance with auth interceptors
│       ├── utils/
│       │   └── aiEngine.js        # AI scoring & recommendation logic
│       ├── App.jsx                # Routes + Theme + Auth providers
│       └── index.css              # Global design system (dark/light CSS vars)
│
└── server/                        # Express backend
    ├── models/
    │   ├── User.js                # User schema (bcrypt pre-save hook)
    │   ├── Vendor.js              # Vendor profile schema
    │   ├── RFQ.js                 # Request for Quotation schema
    │   ├── Quotation.js           # Vendor quotation schema
    │   ├── PurchaseOrder.js       # PO schema (auto tax calc)
    │   ├── Invoice.js             # Invoice schema (auto GST calc)
    │   └── Activity.js            # Audit log schema
    ├── routes/                    # Express route handlers
    ├── middleware/                # Auth middleware (JWT verify)
    ├── seed.js                    # Database seeder (wipe + reseed)
    └── index.js                   # Server entry point
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone & Install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

Create `server/.env`:

```env
MONGO_URI=mongodb://localhost:27017/vendorbridge
JWT_SECRET=your_super_secret_key
PORT=5000
```

### 3. Seed the Database

```bash
cd server
node seed.js
```

This will:
- Wipe all existing data
- Create **4 users** (admin, manager, procurement officer, vendor)
- Create **25 vendors** across 6 categories
- Create **12 RFQs** with varied statuses
- Create **33 quotations** with multi-vendor responses
- Create **5 Purchase Orders** and **5 Invoices**

### 4. Run the Application

```bash
# Terminal 1 — Start backend (port 5000)
cd server
npm run dev

# Terminal 2 — Start frontend (port 5173)
cd client
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🎨 Design System

The UI is built with a fully custom CSS design system supporting **dark and light themes**:

- **Dark mode** (default): Deep navy backgrounds (`#0c0c14`), indigo primary (`#6366f1`), emerald accent
- **Light mode**: Clean white surfaces, rich indigo primary (`#4f46e5`), proper contrast
- Toggle between themes using the **☀️/🌙 button** in the top navigation bar
- All CSS variables defined in `client/src/index.css` under `:root` (dark) and `[data-theme="light"]`
- Smooth transitions on theme switch via `transition: background/color 300ms ease`

---

## 🔒 Security

- Passwords hashed with **bcrypt** (12 salt rounds) via Mongoose pre-save hook
- JWT tokens stored in localStorage with role-based route guards
- Protected routes check role against required permissions before rendering
- All API requests include Bearer token via Axios interceptor

---

## 🤖 AI Engine

The `utils/aiEngine.js` module powers intelligent procurement decisions:

- **Vendor Risk Score** — Composite score from rating, delivery reliability, rejection rate
- **Quotation Recommendation** — Multi-factor scoring: price (40%), delivery (25%), vendor score (35%)
- **Best Vendor Suggestion** — Highlights top-ranked quotation with score breakdown
- All scoring is deterministic and runs client-side — no external API calls

---

## 📌 Key Design Decisions

1. **Fallback to demo data** — If the API is unreachable, pages fall back to hardcoded demo fixtures so the UI is always demonstrable
2. **Custom ConfirmDialog** — All destructive actions (delete vendor, delete RFQ, accept quotation) use a centered modal with blur backdrop instead of `window.confirm()`
3. **Real stat counts** — Dashboard and Approvals page stats always reflect live database counts, not static numbers
4. **No email functionality** — Invoice email sending has been removed; invoices are view/download only

---

*Built for Hackathon 2026 — VendorBridge AI Team*
