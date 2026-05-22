# DevTrackr – AI Developer Productivity Dashboard

> 🚀 A production-ready MERN stack application that connects your GitHub account and delivers AI-powered productivity insights, sprint summaries, and coding analytics.

![Tech Stack](https://img.shields.io/badge/MERN-Stack-blue?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## ✨ Features

- 🔐 **JWT Authentication** – Signup, login, role-based access
- 🐙 **GitHub Integration** – Connect via PAT, fetch repos/commits/PRs/issues
- 🤖 **AI Insights** – OpenAI-powered productivity scoring & recommendations
- 📊 **Analytics Dashboard** – Recharts graphs for commit frequency, PR status, contributor activity
- 🌙 **Dark Mode** – Full theme toggle
- ⚡ **Caching** – In-memory LRU cache for GitHub API calls
- 🛡️ **Security** – Helmet, CORS, rate limiting, bcrypt hashing

---

## 📂 Project Structure

```
project/
├── server/                   # Express + MongoDB Backend
│   ├── config/               # DB connection
│   ├── controllers/          # Route handlers
│   ├── middleware/            # Auth, error handler, rate limiter
│   ├── models/               # Mongoose schemas
│   ├── routes/               # API route definitions
│   ├── services/             # GitHub API + OpenAI integration
│   ├── utils/                # Token gen, async handler, cache
│   └── server.js             # Entry point
│
└── client/                   # React + Vite + Tailwind Frontend
    └── src/
        ├── charts/           # Recharts components
        ├── components/       # Reusable UI components
        ├── context/          # Auth + Theme context
        ├── layouts/          # Page layouts
        ├── pages/            # Route pages
        └── services/         # Axios API calls
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- GitHub Personal Access Token
- OpenAI API key (optional – demo mode works without it)

### 1. Clone & Install

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Configure Environment Variables

```bash
# In server/
cp .env.example .env
```

Edit `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/devtrackr
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=sk-your_openai_key_here
CLIENT_URL=http://localhost:5173
```

### 3. Run the Application

**Backend** (Terminal 1):
```bash
cd server
npm run dev
```

**Frontend** (Terminal 2):
```bash
cd client
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/api/health

---

## 🔑 GitHub Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Select scopes: `repo`, `read:user`
4. Copy the token and paste it in DevTrackr Settings page

---

## 🤖 AI Analysis

If no OpenAI key is provided, the app runs in **demo mode** showing realistic mock insights.

To enable real AI analysis:
1. Get an API key from [platform.openai.com](https://platform.openai.com)
2. Add it to `server/.env` as `OPENAI_API_KEY`
3. The app uses `gpt-4o-mini` for cost-efficient analysis

---

## 📡 API Reference

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/github/connect` | Connect GitHub PAT |
| POST | `/api/github/sync` | Sync GitHub data |
| GET | `/api/github/repos` | Get repositories |
| GET | `/api/github/commits` | Get commits |
| GET | `/api/github/prs` | Get pull requests |
| GET | `/api/github/issues` | Get issues |
| POST | `/api/ai/analyze` | Run AI analysis |
| GET | `/api/ai/sprint-summary` | Get sprint summary |
| GET | `/api/dashboard/summary` | Get dashboard data |

---

## 🧪 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 4, Tailwind CSS |
| Charts | Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcryptjs |
| AI | OpenAI GPT-4o-mini |
| GitHub | GitHub REST API v3 |
| Caching | node-cache (in-memory) |

---

## 📸 Key Pages

- **Dashboard** – Metrics, charts, recent activity
- **Repositories** – All connected repos with language badges
- **Commits** – Searchable commit history
- **Pull Requests** – Open/Merged/Closed filter
- **Issues** – Labels, status, and tracking
- **AI Insights** – Productivity score, recommendations, bottleneck detection
- **Settings** – Profile, GitHub connect, dark mode, password change

---

Made with ❤️ for developers | DevTrackr © 2025
