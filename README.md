# GitHub Repo Explorer

A full-stack web application where users can search any GitHub username and instantly explore their public profile and repositories. The Node.js backend acts as a proxy between the browser and the GitHub API, adding server-side caching to reduce rate-limit pressure and keeping API credentials off the client. The React frontend displays the user's avatar, bio, stats, a sortable and paginated repository list, expandable repo detail cards, and a language distribution chart — all with skeleton loading states and graceful error handling.
![Demo](https://via.placeholder.com/800x400/0d1117/58a6ff?text=GitHub+Repo+Explorer) <!-- Replace with actual screenshot later -->

## ✨ Features

### Must Have
- Search GitHub username and view profile
- Display user stats (followers, following, repos)
- List of public repositories with details
- Sort repositories by Stars, Name, or Last Updated
- Responsive & clean UI

### Should Have / Bonus
- Server-side caching (60 seconds)
- Expandable repository cards
- Recent searches (saved in localStorage)
- Proper error handling (user not found, rate limits)
- Dark modern theme

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + Axios
- **Styling**: Vanilla CSS (Dark Theme)
- **API**: GitHub REST API (proxied through backend)

## 🚀 Live Demo

*(Add your deployed link here after deployment)*

**Frontend**: [Netlify / Vercel Link]  
**Backend**: [Render / Railway Link]

## 📁 Project Structure

```
github-repo-explorer/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   └── vite.config.ts
├── server/                 # Node.js Backend
│   ├── index.js
│   └── package.json
├── README.md
└── .gitignore
```

## 🏃 How to Run Locally

### Prerequisites
- Node.js (v18 or higher)

### Backend
```bash
cd server
npm install
npm run dev
```
*(Runs on http://localhost:5000)*

### Frontend
```bash
cd client
npm install
npm run dev
```
*(Runs on http://localhost:5173)*

## 📡 API Documentation

### `GET /api/user/:username`
- Fetches user profile and repositories
- **Cached** for 60 seconds on the server
- Returns user info + array of repos




"# Github-Repo-Explorer" 
