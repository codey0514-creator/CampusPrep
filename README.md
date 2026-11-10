# CampusPrep

CampusPrep is a placement experience sharing platform for students of IIT Bhilai. Students can read interview and online assessment (OA) experiences shared by their peers, search by company, and submit their own. Every submission is reviewed by an admin before it goes live.

## Features

**Students**
- Sign in with their institute Google account
- Browse approved placement experiences
- Search by company name
- Filter by type: All, OA, Interview
- Submit a new experience (goes to review as `pending`)

**Admins**
- View all pending posts
- Approve or reject submissions
- Manage all content

**Access control**
- Only emails ending in `@iitbhilai.ac.in` can sign in
- Admins are identified by hardcode

## Tech Stack

- **Frontend:** HTML, CSS, vanilla JavaScript
- **Backend:** Node.js
- **Data storage:** JSON file 
- **Authentication:** Google OAuth 2.0

## Application Flow

```
[ Visitor Arrives at Domain ]
             |
             v
[ Google OAuth Sign-In Page ]
             |
             v
    (Node.js checks email)
   Does it end with @iitbhilai.ac.in?
        /                  \
      NO                   YES
      |                     |
      v                     v
[ Access Denied ]    (Node.js checks against Admin list)
                     Is email in the hardcoded ADMIN_EMAILS array?
                          /                   \
                        YES                    NO
                        |                      |
                        v                      v
              [ Admin Dashboard ]      [ Student Feed (Home) ]
              - View Pending Posts     - View 'Approved' Posts only
              - Approve/Reject form    - Filter by Company
              - Manage all content     - Submit new Post form
                        |                      |
                        |                      v
                        |              [ Student Submits Post ]
                        |              (Saved to JSON as 'pending')
                        |                      |
                        |<---------------------'
                        v
              [ Admin Reviews Post ]
              - Clicks 'Approve' (updates JSON status to 'approved')
              - Clicks 'Reject' (deletes entry or marks 'rejected')
                        |
                        v
              [ Post Goes Live on Student Feed ]
```

## Post Lifecycle

| Status     | Meaning                                  | Visible to students |
|------------|------------------------------------------|---------------------|
| `pending`  | Submitted, waiting for admin review      | No                  |
| `approved` | Approved by an admin                     | Yes                 |
| `rejected` | Rejected by an admin (or entry is deleted) | No                |

## Project Structure

```
campusprep/
├── viewer.html      # Student feed page (search, filters, experience cards)
├── style.css        # Dark purple, GitHub-style theme
├── script.js        # Frontend logic (search, filtering, rendering)
├── server.js        # Node.js backend (auth, routes, JSON read/write)
├── data/
│   └── posts.json   # Stores all posts and their status
└── README.md
```

> Adjust the file names above to match your actual project layout.

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- A Google Cloud project with OAuth 2.0 credentials

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd campusprep
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the data file**

   Create `data/posts.json` with an empty array:
   ```json
   []
   ```
   Each post is stored as an object. Example:
   ```json
   [
     {
       "id": 1,
       "authorEmail": "student@iitbhilai.ac.in",
       "company": "Example Corp",
       "type": "interview",
       "content": "Round 1 was a DSA round...",
       "status": "pending",
       "createdAt": "2026-11-10T10:30:00.000Z"
     }
   ]
   ```
   `type` is either `oa` or `interview`, and `status` is `pending`, `approved` or `rejected`.

4. **Configure Google OAuth**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/) and create OAuth 2.0 credentials
   - Add your authorized redirect URI (for example, `http://localhost:3000/auth/google/callback`)

5. **Create a `.env` file**
   ```env
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   SESSION_SECRET=a-long-random-string
   ```

6. **Add admin emails**

   In the backend, edit the hardcoded array:
   ```js
   const ADMIN_EMAILS = [
       'admin1@iitbhilai.ac.in',
       'admin2@iitbhilai.ac.in'
   ];
   ```

7. **Start the server**
   ```bash
   node server.js
   ```
   Then open `http://localhost:3000` in your browser.

## Security Notes

- Email domain checks must happen on the server, never only in the browser.
- Never commit your `.env` file. Add it to `.gitignore`.
- Admin routes should verify the admin status on every request, not just at login.
- Validate and sanitize all submitted post content before saving it to the JSON file.
- Keep `data/posts.json` out of public static folders so it can't be downloaded directly.
- Writes to a JSON file are not atomic. Avoid simultaneous writes (for example, queue them) to prevent data corruption.

## Future Improvements

- Move from a JSON file to a database (such as MySQL) if the data grows
- Move the admin list from a hardcoded array to a config file or database
- Add pagination for the experience feed
- Let students edit or delete their own pending posts
- Email notification when a post is approved or rejected

## License

Add your license here (for example, MIT).