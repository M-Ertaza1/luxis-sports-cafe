# Luxis Sports Café — Admin Management System

A full-stack internal management system for a sports café and arena-booking business. It handles arena bookings, café inventory across two kitchens, sales, and reporting from a single role-based admin dashboard, with real-time updates pushed live to every connected screen.

Built with a React front end and a Node/Express + PostgreSQL back end, secured with JWT authentication and role-based access control.

---

## Features

**Arena Bookings**
- Book any of four arenas (Cricket, Futsal, Handball, Subsoccer) with double-booking prevention (overlapping time slots are rejected).
- Payment-driven status model: paying confirms a booking, leaving it unpaid marks it as *Waiting for Payment*. Bookings can be marked completed or cancelled, with rules (e.g. a paid booking can't simply be cancelled, and completed bookings are locked from edits).
- Past dates and past times are rejected at the API level.
- Two views: a sortable table and a monthly calendar with colour-coded sport types.

**Dashboard & Analytics**
- Live revenue summary (bookings + café sales, combined and separate).
- Today's bookings and upcoming bookings, each with a live countdown ticking down to the session start (days / hours / minutes / seconds).
- Low-stock alerts, kitchen-wise sales breakdown, and a performance-analytics panel showing top-selling items and most-booked arenas over a selectable period (7 days to 1 year).

**Inventory & Two-Kitchen Stock**
- Two item types: *stock* items (counted directly) and *fresh-on-demand* items (built from a recipe of stock ingredients).
- Per-kitchen stock tracking for a Main kitchen and a Counter kitchen.
- Atomic stock transfers from Main to Counter with insufficient-stock guards.
- Recipe management — when a fresh item is sold, its ingredient stock is deducted automatically.
- Per-item low-stock thresholds that feed the dashboard alerts.

**Sales**
- Record café sales per kitchen; stock is deducted automatically (directly for stock items, via recipe for fresh items), with server-computed totals.
- Sales history with a kitchen filter and running totals.

**Audit Log**
- Every create, update, delete, sale, transfer, and stock adjustment is recorded with the acting user, entity, and timestamp.
- Filterable by date (today, yesterday, last 3 / 7 days, or a custom range).

**Access Control**
- Three roles — Super Admin, Secondary Admin, and Viewer — each with a distinct permission set, enforced on the server and reflected in the UI (controls are hidden when not permitted).
- Super Admins manage users and arena pricing; Secondary Admins handle day-to-day operations; Viewers are read-only.

**Account & Appearance**
- Self-service settings: change your own name, email, and password.
- Full light/dark theme with a toggle, respecting the operating-system preference by default and persisting the choice.

**Real-Time**
- Changes broadcast over WebSockets, so every open dashboard updates instantly without a refresh.

---

## Tech Stack

**Front end**
- React (Vite)
- React Router
- Tailwind CSS
- Axios (with automatic token refresh)
- Socket.IO client

**Back end**
- Node.js + Express
- PostgreSQL
- Prisma ORM
- Socket.IO
- JWT authentication (access + refresh tokens)
- bcrypt password hashing

---

## Architecture

The project is a monorepo with two parts:

```
luxis-sports-cafe/
├── client/        React front end (Vite)
│   └── src/
│       ├── pages/         one screen per feature (Dashboard, Bookings, …)
│       ├── components/    shared UI (Layout, Sidebar, forms, dialogs)
│       ├── api.js         axios instance + token-refresh interceptor
│       └── socket.js      Socket.IO client
│
└── server/        Express API
    └── src/
        ├── controllers/   business logic per module
        ├── routes/        API route definitions
        ├── middleware/    auth + permission guards
        └── utils/         audit logging + real-time helpers
    └── prisma/
        ├── schema.prisma  data model (11 tables)
        └── seed.js        seed roles, users, and arenas
```

Mutations run inside database transactions, are written to the audit log, and emit a real-time event so connected clients refresh automatically.

---

## Running Locally

### Prerequisites
- Node.js 18+ and npm
- A PostgreSQL database (local install, or Docker)

### 1. Clone and install

```bash
git clone https://github.com/M-Ertaza1/luxis-sports-cafe.git
cd luxis-sports-cafe

# install back-end dependencies
cd server
npm install

# install front-end dependencies
cd ../client
npm install
```

### 2. Configure the back-end environment

Create a `server/.env` file:

```env
PORT=5000
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/luxis_sports_cafe?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@localhost:5432/luxis_sports_cafe?schema=public"
JWT_ACCESS_SECRET="any-long-random-string"
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

Replace `USER` and `PASSWORD` with your PostgreSQL credentials, and make sure a database named `luxis_sports_cafe` exists.

### 3. Set up the database

```bash
cd server
npx prisma migrate deploy   # create the tables
npx prisma generate         # generate the Prisma client
node prisma/seed.js         # seed roles, users, and arenas
```

### 4. Run the app

In two terminals:

```bash
# terminal 1 — back end (http://localhost:5000)
cd server
npm run dev
```

```bash
# terminal 2 — front end (http://localhost:5173)
cd client
npm run dev
```

Open **http://localhost:5173**.

---

## Demo Login

The seed script creates three accounts you can sign in with:

| Role            | Email                          | Password       |
|-----------------|--------------------------------|----------------|
| Super Admin     | `admin@luxissportscafe.com`    | `ChangeMe123!` |
| Secondary Admin | `manager@luxissportscafe.com`  | `Manager123!`  |
| Viewer          | `viewer@luxissportscafe.com`   | `Viewer123!`   |

> These are seed credentials for local development. Change them before using the system for anything real.

---

## Notes

This was built as a real-world internal tool and as a portfolio project demonstrating full-stack development: relational data modelling, authentication and authorization, transactional business logic, real-time updates, and a responsive themed interface.