# UI redesign notes (frontend only - server untouched)

- `client/src/styles/index.css`: tokens now monochrome + sharp corners; new "V2" layer at the bottom.
- New: `components/common/HeroBanner.jsx` (full-width club-poster banner on every page, rendered in Layout),
  `components/common/ClubBand.jsx` (full-width poster rows on Home + Clubs).
- `ClubDetail`: poster fills full screen width.
- `DashboardSidebar`: "Edit profile" button with the user's avatar on its right; profile routes added for
  admin / president / coordinator (previously member only). Reuses existing MemberProfile page.
- Fonts: Inter only (index.html). No API, auth, routing or backend logic was changed.

## Feature update (roles, social links, events, notifications, gallery)
Server
- `Club.team[]` (name, role, email, phone, image, order) - role holders WITHOUT logins. Endpoints (admin / own-club president):
  `POST /api/clubs/:id/team`, `PUT /api/clubs/:id/team/:memberId`, `DELETE /api/clubs/:id/team/:memberId`.
- `Club.socialLinks[]` (name, url). Saved via `PUT /api/clubs/:id` by president/admin only; http(s) URLs only.
- `utils/eventStatus.js`: upcoming -> ongoing -> completed automatically (on boot, every 5 min, and on event/stats/analytics reads).
  Events without `endDate` count as same-day. Cancelled events are untouched. Registration closes for completed/cancelled events.
- `Notification.image` (optional). `GET /api/gallery?club=none` returns the general gallery.
Client
- Public page `/clubs/:id/team` (filter by role, search). Team preview + social links on club detail; social links + Team button on club bands.
- President > Coordinators page: "Team & roles" manager (photo, role, contact, order) above the login coordinators.
- President > Club Info: social media links editor.
- Overview (president & coordinator) now shows stats, latest announcements, upcoming events, analytics charts (president), social links.
- Coordinators get a Notifications page. Notification form has an optional image; cards show it full width.
- Events lists hide finished events by default ("Show past events" toggle).
- Public gallery: chips per club, grouped by club when "All" (selection kept in `?club=`).

## Security / onboarding update
Server
- `AllowedEmail` (college email list) + `EmailOtp` (hashed, 10-min TTL, 5 attempts, 60s resend throttle).
- Auth: `POST /api/auth/check-email`, `/send-otp`, `/google`, `GET /api/auth/config`. Register now needs email + OTP + password.
  Login tells students whether their email is on the college list. Rate-limited with express-rate-limit.
- Password policy (8+, lowercase, uppercase, special char) on register / change / reset (`utils/passwordPolicy.js`).
- Profile: `profileCompleted` flag; `PUT /api/auth/me` validates name, 10-digit mobile, bio <= 300. `profileComplete` is returned with the user.
- Join request: `message` required (10-300 chars) and a complete profile is required. Applicant details (photo, phone, bio) returned to reviewers.
- `GET /api/clubs/:id/members` (admin / own-club president) with join date + reason. `GET /api/admin/users/:id`.
- Admin: `GET/POST /api/admin/allowed-emails`, `POST .../import` (csv/xlsx/xls, 5 MB), `DELETE .../:id`.
- Exports: ownership checks on members / attendance / participation; CSV-injection guard; richer member columns.
- Events: completed / ongoing events can no longer be deleted (kept as club history).
- Privacy fixes: public club endpoint returns `memberCount` instead of member names/emails; public event endpoint hides participants from non-staff.
- New env vars: GOOGLE_CLIENT_ID, GOOGLE_ALLOWED_DOMAIN. New deps: xlsx, google-auth-library, express-rate-limit (run `npm install` in /server).
Client
- Register: 2-step (email check + OTP, then code + password with live rules). Google button on Login/Register.
- `/complete-profile` (name, photo, 10-digit mobile, optional bio) enforced by ProtectedRoute for every role.
- Join modal with character counter; Join Requests page shows each applicant's details; members pages open a details modal on click (president, admin All Users, admin club members).
- Downloads now go through axios (`api/download.js`) so the login token is sent - this was why exports failed.
- Admin > College Emails page (upload csv/xlsx, search, add, remove).
- President / coordinator dashboards show their own club's banner.
- Club page is a mini-site: Home / Events (upcoming + previous) / Gallery / Team tabs at `/clubs/:id/:tab`.

## Navigation
- After login the navbar has no Home link (Dashboard instead); `/` redirects logged-in users to their dashboard.

## OTP mode switch (server/.env)
- `OTP_MODE=email` (default): real random code emailed to the student.
- `OTP_MODE=fixed` + `FIXED_OTP=123456`: no email, everyone uses the fixed code. Whitelist, password rules and profile steps still apply.
- Switch back by setting `OTP_MODE=email` and restarting the server. The server logs a warning on startup while fixed mode is on.

## Fixes: join dialog + roles by email
- `components/common/JoinRequestModal.jsx`: single "why do you want to join" dialog (10-300 chars) used on the club page AND the student dashboard
  (the dashboard used to send an empty request, which the server now rejects).
- Team roles are linked to real accounts: `Club.team[].user` + role + order + showEmail/showPhone. The president types an email, the person is
  auto-fetched (`GET /api/clubs/:id/team/lookup?email=`), must be a member of that club, and name/photo/contact come from their own profile
  (so profile edits show up automatically). Defaults: email public, mobile private. Old typed-in entries still display until re-added.
- New: `GET /api/clubs/:id/team` (manager view). Lookup reveals phone/photo only for club members.

## Event pop-ups, event notifications, president attendance
- `components/common/EventDetailModal.jsx`: click any event (club page, student events, event manager, guest home, overview, my participations,
  event notifications) -> popup with banner, status, club link, start/end, venue, registered count, organiser, description, countdown,
  Google Calendar link and a Participate button. Logged-out visitors are sent to login and returned afterwards (`location.state.from`).
- Server: creating an event pushes a notification (type `event`, club-scoped, banner as image, links back to the event); rescheduling /
  venue change and cancelling push "updated" / "cancelled" notifications. `utils/eventNotify.js`.
- `GET /api/notifications` now includes every club the user is a MEMBER of (it used to look only at `user.club`, which students don't have).
- `POST /api/events/:id/participate` is open to any logged-in role (atomic `$addToSet`). `GET /api/events/:id` returns `registered` + `participantCount`.
- `PUT /api/events/:id` now only accepts title/description/venue/date/endDate/bannerImage/status (it used to copy the whole body).
- Attendance: president can mark attendance for own club (`/president/attendance`), `POST /api/attendance/bulk` (mark all present/clear),
  only registered participants can be marked, ownership checked on mark + view.
