# 🎓 MTech Class Hub — Saintgits College of Engineering

A modern, responsive, private academic collaboration workspace designed exclusively for **6 M.Tech Computer Science scholars** at **Saintgits College of Engineering, Kottayam, Kerala**.

---

## 🌟 Key Highlights

* **Private Class Access**: Lightweight shared class code verification (`2628`) with one-click classmate selection (**Christo, Nikitha, Mintu, Kishore, Aneena, Alena**).
* **Equal Contribution Model**: All 6 classmates can upload lecture notes, create assignments, share question papers, and post announcements.
* **Dynamic Semester System**: Dynamic support for **S1, S2, S3, S4** with configurable subjects, modules (Modules 1–5), and semester archiving (old semester notes are preserved permanently).
* **Important Due-Date Lifecycle**:
  - `Created` ➔ `Upcoming` ➔ `Due Soon` (≤ 7 days) ➔ `Due Today` (≤ 24 hours, critical) ➔ `Expired`.
  - **Zero Reminder Clutter**: Expired assignments automatically disappear from Dashboard Due Soon, active counters, and notifications, but are **permanently archived in Assignment History** for future revision!
* **📚 Notes Repository**: Organizes notes by `Semester ➔ Subject ➔ Module ➔ Category (Notes, PPT, Reference, Question Papers, Important Questions, Assignments)`.
* **📄 Question Papers Vault**: Grouped by `Semester ➔ Subject ➔ Exam Type (Internal 1, Internal 2, Model Exam, End Semester, Previous Year) ➔ Year`.
* **🤖 Grounded AI Study Assistant**:
  - Grounded strictly in uploaded lecture notes, PPTs, and question papers.
  - Cites exact source files (e.g. `📄 Distributed Systems Module 2 Notes - Grid Computing.pdf`).
  - If a topic is not in the uploaded files, it clearly states that the information is not found in the class materials rather than hallucinating.
  - Interactive Study Modes: **Explain**, **Summarize**, **Important Questions**, **Quiz Me**, **1-Day Revision Plan**, **Simplify**, **Ask from Notes**.
  - Configurable in Settings to run offline via built-in RAG or connected to Google Gemini via API key.
* **Global Search**: High-speed partial search across notes, PDFs, assignments, announcements, and subjects.
* **File Previews**: In-app PDF/notes reader without forcing file downloads.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (Tested on v24.13.1)
- **npm**: v9+

### 2. Start Both Server and Client
From the project root:

```bash
# Start frontend (port 3000) and backend (port 5000) concurrently
npm run dev
```

Or run them individually:

```bash
# Terminal 1: Backend API (port 5000)
cd server
npm start

# Terminal 2: Frontend Vite App (port 3000)
cd client
npm run dev
```

### 3. Accessing the Application
- Open your browser to: **`http://localhost:3000/`**
- **Default Access Code**: `2628`
- **Classmate selection**: Select your name from the 6 members list (Christo, Nikitha, Mintu, Kishore, Aneena, Alena).

---

## 🏛️ Project Architecture

```text
M TECH Hub/
├── client/                     # Frontend (React 19 + Vite + Tailwind CSS v4 + Lucide Icons)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Reusable Modal, ConfirmModal, Badge, FilePreviewModal, UploadModal
│   │   │   └── layout/         # Responsive Sidebar, Topbar with classmate switcher, Layout shell
│   │   ├── context/            # AuthContext (active classmate state, settings, access code)
│   │   ├── pages/              # Dashboard, Semesters, Subjects, Assignments, Notes, QP, AI Assistant, Search
│   │   ├── services/           # Axios API services
│   │   ├── App.jsx             # React Router structure
│   │   └── index.css           # Glassmorphism dark theme tokens
│   ├── package.json
│   └── vite.config.js          # Tailwind v4 plugin and API proxy configuration
├── server/                     # Backend API (Express.js + Multer + Local Store + RAG Engine)
│   ├── data/
│   │   ├── initialData.js      # Realistic M.Tech CS seed data (Saintgits curriculum)
│   │   ├── store.js            # Atomic persistence & assignment urgency calculator
│   │   └── store.json          # Persistent JSON database (survives restarts)
│   ├── routes/
│   │   └── api.js              # REST endpoints for all resources
│   ├── services/
│   │   └── aiService.js        # RAG study assistant with source citations & Gemini integration
│   ├── uploads/                # Local uploaded files storage
│   ├── package.json
│   └── server.js               # Express server entrypoint (port 5000)
├── start-all.js                # Cross-platform runner for server + client
├── package.json                # Root package.json
└── README.md
```

---

## 👥 Predefined Classmates
1. **Christo**
2. **Nikitha**
3. **Mintu**
4. **Kishore**
5. **Aneena**
6. **Alena**

*Note: Member names and the class access code can be modified at any time in **Settings**.*
