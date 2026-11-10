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
