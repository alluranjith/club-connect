# ClubConnect

A full-stack **MERN** platform for managing campus clubs — four roles (Admin, President,
Coordinator, Member), club membership workflows, events, attendance, notifications, and a
shared gallery.

---

## 1. Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18 (Vite), React Router v6, Axios, react-hot-toast, react-icons |
| Backend | Node.js, Express, MongoDB + Mongoose, JWT auth, bcryptjs |
| Extras | `json2csv` for CSV export, Nodemailer for password-reset emails |

Styling uses **CSS custom properties** defined once in `client/src/styles/index.css` (`:root`
block) — change ~10 variables there to re-theme the entire app. No component hardcodes colors.

---

## 2. Project structure

```
clubconnect/
├── server/                    # Express API
│   ├── config/db.js
│   ├── models/                # User, Club, Event, Notification, Gallery, Attendance, JoinRequest, Participation
│   ├── middleware/             # auth.js (JWT), role.js (RBAC), errorHandler.js
│   ├── controllers/            # one per feature module
│   ├── routes/                 # one per feature module
│   ├── utils/                  # generateToken, sendEmail, seedAdmin
│   └── server.js
└── client/                    # React app
    └── src/
        ├── api/                # axios instance + endpoints.js (all API calls, grouped)
        ├── context/AuthContext.jsx
        ├── components/
        │   ├── layout/         # Navbar, Footer, Layout, ProtectedRoute, DashboardSidebar, DashboardShell
        │   ├── common/         # Loader, Modal, ConfirmDialog, EmptyState, RoleBadge
        │   └── shared/         # GalleryManager, NotificationManager, EventManager (reused across roles)
        ├── modules/
        │   ├── auth/           # Login, Register, ForgotPassword, ResetPassword
        │   ├── public/         # Home, AboutUs, AboutClubs, ClubDetail, PublicGallery, NotFound
        │   ├── admin/
        │   ├── president/
        │   ├── coordinator/
        │   └── member/
        └── styles/index.css    # design system - :root variables + animations
```

---

## 3. Getting started

### Backend
```bash
cd server
npm install
cp .env.example .env      # fill in MONGO_URI, JWT_SECRET, SMTP creds (optional), admin bootstrap creds
npm run dev                # starts on http://localhost:5000
```
On first boot the server auto-creates **one** admin account from `ADMIN_EMAIL` /
`ADMIN_PASSWORD` in `.env`. There is no admin self-registration route — this is by design.

### Frontend
```bash
cd client
npm install
npm run dev                 # starts on http://localhost:5173, proxies /api to :5000
```

---

## 4. Roles & permissions summary

| Feature | Admin | President | Coordinator | Member |
|---|---|---|---|---|
| Create / disband clubs | ✅ | ❌ | ❌ | ❌ |
| Assign president / manage coordinators | ✅ | ❌ | ❌ | ❌ |
| Accept/reject join requests | ✅ | ✅ (own club) | ✅ (own club) | ❌ |
| Kick club member | ✅ | ✅ (own club) | ❌ | ❌ |
| Post notifications / events | ✅ (platform-wide) | ✅ (own club) | ✅ (own club) | view only |
| Post/remove gallery images | ✅ | ✅ (own club) | ✅ (own club) | view only |
| Mark attendance | ❌ | ❌ | ✅ | ❌ |
| Register/participate in events | — | — | — | ✅ (club & non-club members) |
| Export CSV (attendance/participation/members) | ✅ | ✅ | ✅ | ❌ |

**Member sub-states** (`membershipStatus` on the User model):
- `none` → hasn't requested to join any club yet
- `pending` → join request submitted, awaiting a decision
- `accepted` → full club member
- `rejected` → non-club member; can still browse notifications/events/gallery and participate in events, but has no club-management privileges

---

## 5. Suggested module split for a 6-person team

Each module below maps cleanly to backend routes + matching frontend pages, so pairs (or
individuals) can work independently with minimal merge conflicts.

1. **Auth & Core Infrastructure** — `server/{routes,controllers}/authRoutes/authController.js`,
   JWT/role middleware, `client/src/modules/auth/*`, `AuthContext`, `axios.js`/`endpoints.js`,
   `ProtectedRoute`. (Foundation — build first / own it throughout.)
2. **Admin Module** — club CRUD, coordinator management, admin stats/user management.
   `server/{routes,controllers}/{clubRoutes,adminRoutes}`, `client/src/modules/admin/*`.
3. **President Module** — join-request decisions, member kicking, president dashboard.
   `client/src/modules/president/*` (uses club routes from module 2 + shared components).
4. **Coordinator Module** — attendance marking, club info editing.
   `server/{routes,controllers}/attendanceRoutes/attendanceController.js`,
   `client/src/modules/coordinator/*`.
5. **Events, Notifications & Gallery (shared components)** — `EventManager`,
   `NotificationManager`, `GalleryManager` in `client/src/components/shared/`, plus their
   backend routes/controllers. These are reused by admin/president/coordinator, so build them
   with generic `clubId` props from the start.
6. **Member Module & Public Pages** — member dashboard (join flow, events, participations,
   gallery, profile), plus the public-facing Home/About/Gallery/ClubDetail pages and the
   overall design system (`index.css`).

Because feature areas map 1:1 to a route file + controller + a folder under
`client/src/modules/`, two people can safely work on different roles at the same time without
touching each other's files. Only `App.jsx` (routing) and `endpoints.js` (API calls) are shared
files — coordinate merges there.

---

## 6. Theming

To re-skin ClubConnect, edit only the `:root` block at the top of
`client/src/styles/index.css`:

```css
:root {
  --color-primary: #5b3df0;
  --color-secondary: #00c2a8;
  --color-bg: #f7f7fb;
  /* ...etc */
}
```

A `[data-theme='dark']` override is included as a starting point for a dark mode toggle.

---

## 7. Notable design decisions

- **Single admin, seeded not registered** — prevents privilege escalation via the public
  register endpoint.
- **Role promotion is admin-driven** — everyone registers as `member`; admin promotes accounts
  to `president`/`coordinator` by email when assigning them to a club.
- **Reusable feature components** (`EventManager`, `NotificationManager`, `GalleryManager`)
  take a `clubId` prop (`null`/`undefined` = platform-wide for admin) so the exact same
  component powers three different dashboards.
- **CSV export** endpoints stream directly from Mongo via `json2csv` — no temp files.
- Navbar/footer are hidden on `/login`, `/register`, `/forgot-password`, and
  `/reset-password/:token` via a route allow-list in `components/layout/Layout.jsx`.
