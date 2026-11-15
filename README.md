# CampusPrep

CampusPrep is a placement experience sharing platform for students of IIT Bhilai.
Students can read interview and online assessment (OA) experiences shared by their
peers, search by company, and submit their own. Every submission is reviewed by
an admin before it goes live.

Git hub Link - https://github.com/codey0514-creator/CampusPrep

## Features

**Students**
- Sign in with their institute Google account (`@iitbhilai.ac.in` only)
- Choose a role after login: viewer or contributor
- Browse approved placement experiences
- Search by company name
- Filter by type: All, OA, Interview
- Submit a new experience (optionally anonymous) — saved as `pending`

**Admins**
- View all pending posts
- Approve or reject submissions
- Admin access is granted via the `ADMIN_EMAILS` environment variable

## Tech Stack

- **Frontend:** HTML, CSS, vanilla JavaScript
- **Backend:** Node.js + Express 5
- **Auth:** Google OAuth 2.0 via Passport (`passport-google-oauth20`)
- **Sessions:** `express-session`
- **Data storage:** JSON files on disk (no database)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

Dependencies: `dotenv`, `express`, `express-session`, `passport`,
`passport-google-oauth20`.

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SESSION_SECRET=any-long-random-string
ADMIN_EMAILS=admin1@iitbhilai.ac.in,admin2@iitbhilai.ac.in
```

- `ADMIN_EMAILS` is a comma-separated list; matching is case-insensitive.
- Configure your Google OAuth consent screen / credentials with the callback
  URL `http://localhost:3000/auth/google/callback`.

### 3. Run the server

```bash
npm start
```

The app runs on `http://localhost:3000`. On first startup the server
auto-creates `public/data/posts.json` and `public/data/pending-posts.json`
if they don't exist.

## Application Flow

```
[ Google OAuth Sign-In ]
          |
          v
 Email ends with @iitbhilai.ac.in?
      /            \
    NO             YES
    |               |
    v               v
[Denied]    [ /choose-role.html ]
                /      |      \
           viewer  contributor  admin (if in ADMIN_EMAILS)
             |          |          |
             v          v          v
       veiwer.html  contributor/  admin.html
                     contributor.html
                          |
                          v
                  POST /api/posts
                  (status: pending)
                          |
                          v
              Admin approves -> posts.json
              Post goes live on student feed
```

## Post Lifecycle

| Status     | Meaning                                   | Visible to students |
|------------|-------------------------------------------|---------------------|
| `pending`  | Submitted, waiting for admin review       | No                  |
| `approved` | Approved by an admin                      | Yes                 |
| `rejected` | Rejected by an admin (or entry deleted)   | No                  |

## Data Storage

All data lives in JSON files under `public/data/`:

- `posts.json` — approved posts shown on the student feed
- `pending-posts.json` — the moderation queue (pending + decided posts)

Each post record contains: `id`, `company`, `type` (`oa` | `interview`),
`year`, `branch`, `questions`, `experience`, `tips`, `isAnonymous`,
`authorName`, `authorEmail`, `status`, `createdAt`, and (once approved)
`approvedAt` / `approvedBy`.

## API Overview

| Method | Route                          | Guard               | Purpose                        |
|--------|--------------------------------|---------------------|--------------------------------|
| GET    | `/auth/google`                 | —                   | Start Google OAuth             |
| GET    | `/auth/google/callback`        | —                   | OAuth callback → role select   |
| GET    | `/api/me`                      | `requireLogin`      | Current user info              |
| POST   | `/select-role`                 | `requireLogin`      | Set `req.session.selectedRole` |
| GET    | `/api/posts/approved`          | `requireLogin`      | List approved posts            |
| POST   | `/api/posts`                   | `requireContributor`| Submit a new experience        |
| GET    | `/api/admin/pending-posts`     | `requireAdmin`      | List pending submissions       |
| POST   | `/api/admin/approve/:id`       | `requireAdmin`      | Approve a submission           |

## Project Structure

```
campusprep/
├── server.js                  # Express backend (auth, routes, JSON read/write)
├── veiwer.html                # Student feed page (note: filename is misspelled)
├── script.js                  # Frontend logic (search, filtering, rendering)
├── style.css                  # Dark theme
├── admin.html                 # Admin moderation dashboard
├── choose-role.html           # Role selection page
├── contributor/
│   ├── contributor.html       # Submission form
│   ├── contributor.js         # Form logic → POST /api/posts
│   └── contributor.css
├── public/
│   └── data/
│       ├── posts.json         # Approved posts
│       └── pending-posts.json # Moderation queue
├── .env                       # Secrets (not committed)
├── package.json
└── README.md
```

```
