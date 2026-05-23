# DevPulse – Internal Tech Issue Tracker

DevPulse is a backend API for reporting, tracking, and managing software issues (bugs & feature requests) in a collaborative development environment.

## 🚀 Live API
https://devpulse-server-rho.vercel.app/

## 🧰 Tech Stack
- Node.js (LTS)
- TypeScript
- Express.js (modular architecture)
- PostgreSQL (raw `pg` driver)
- JWT (authentication)
- bcrypt (password hashing)

## 📦 Features
- User registration & login (JWT auth)
- Role-based access control (contributor / maintainer)
- Create, view, update, and delete issues
- Issue filtering & sorting
- Reporter details included in responses

## 🔐 Roles
**Contributor**
- Register/Login
- Create issues
- View issues

**Maintainer**
- All contributor permissions
- Update/delete any issue
- Manage issue workflow

## 🗄️ Database
Tables:
- `users` (id, name, email, password, role, created_at, updated_at)
- `issues` (id, title, description, type, status, reporter_id, created_at, updated_at)

## 📡 API Endpoints

### Auth
- POST `/api/auth/signup`
- POST `/api/auth/login`

### Issues
- POST `/api/issues`
- GET `/api/issues`
- GET `/api/issues/:id`
- PATCH `/api/issues/:id`
- DELETE `/api/issues/:id`

## ⚙️ Setup

```bash
git clone https://github.com/yourusername/devpulse
cd devpulse
npm install
npm run dev
