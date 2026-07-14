# ⚙️ BuddyScript API

BuddyScript API is a robust, production-ready backend built with **Express 5**, **TypeScript**, and **Prisma (MongoDB)**. It powers the BuddyScript social client with secure authentication, multi-threaded interactions (posts, comments, replies, reactions), OTP verification, and high-performance caching.

---

## ✨ Features

- 🔑 **Secure Authentication** - JWT-based login/signup with sliding refresh token rotation and Redis-backed blacklists.
- ✉️ **OTP & Email Flows** - Auto-generated verification OTPs and password resets using NodeMailer.
- 🛡️ **Role-Based Access Control** - Granular route protection middleware (e.g., `USER`, `ADMIN`).
- 💾 **Prisma ORM & MongoDB** - Modern schemas equipped with optimized database indexes for fast feed lookups.
- 🚀 **Performance Middleware** - Hardened security headers (Helmet), CORS, parameter pollution guards (HPP), and custom Rate Limiters.
- 🛠️ **CLI Code Generator** - Scaffold routes, controllers, services, and schemas in seconds using custom CLI helpers.
- 📝 **Structured Logging** - Multi-level log files configured using Winston daily-rotating logs.

---

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express 5 & TypeScript
- **Database ORM:** Prisma Client
- **Database:** MongoDB
- **Caching & Caching:** Redis (`ioredis`)
- **Validation:** Zod Schema Validation
- **Logging:** Winston
- **Testing:** Jest & Supertest

---

## 🚀 Quick Start

### 1. Prerequisites
Ensure you have **Node.js 20+**, **MongoDB**, and **Redis** running locally.

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy the configuration environment file and adjust keys:
```bash
cp .env.example .env
```
Ensure `DATABASE_URL` (MongoDB cluster URI) and `REDIS_HOST`/`REDIS_PORT` are configured correctly.

### 4. Database Setup & Sync
Generate the Prisma client and push schema updates to MongoDB:
```bash
npm run prisma:generate
npm run prisma:seed
```

### 5. Running the Application
Start the backend dev server (auto-reloads on change):
```bash
npm run dev
```
The API is available at [http://localhost:8000/api/v1](http://localhost:8000/api/v1).

---

## 🛠️ Scaffolding New Modules
You can easily spin up a fully-scaffolded module (routes, controllers, schemas, types) using the CLI generator:

```bash
# Generate a new module and register its routes automatically
npm run module:create -- <ModuleName>

# Generate a new module without automatically registering its routes
npm run module:create:no-route -- <ModuleName>
```

---

## 📁 Project Structure

```text
src/
├── app/
│   ├── middlewares/      # Request validation, authentication, and error interceptors
│   ├── modules/          # Core modules: Auth, Post, Upload, User (controllers, routes, services)
│   ├── routes/           # Unified router index
│   └── db/               # Database seed scripts
├── config/               # Global configuration options
├── lib/                  # Redis connection, Prisma client, Swagger docs configuration
├── shared/               # Reusable controller wrapper and utility schemas
└── utils/                # General purpose helpers (Logger, Mailer, etc.)
```
