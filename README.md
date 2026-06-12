# Task Manager API

REST API untuk manajemen tugas dengan autentikasi JWT, dibangun menggunakan Node.js, Express, dan MongoDB.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JSON Web Token (JWT)
- **Validation**: express-validator
- **Docs**: Swagger UI (OpenAPI 3.0)

## Cara Menjalankan

### 1. Clone & Install

```bash
git clone https://github.com/username/task-manager-api.git
cd task-manager-api
npm install
```

### 2. Setup environment

```bash
cp .env.example .env
```

Edit `.env` sesuai konfigurasi lokal:

```
PORT=3000
MONGO_URI=mongodb://localhost:27017/taskdb
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
```

### 3. Jalankan server

```bash
# Development (dengan auto-reload)
npm run dev

# Production
npm start
```

### 4. Buka Swagger Docs

Akses dokumentasi interaktif di: **http://localhost:3000/api-docs**

---

## Endpoints

### Auth

| Method | Endpoint            | Deskripsi              | Auth |
|--------|---------------------|------------------------|------|
| POST   | /api/auth/register  | Daftar akun baru       | ❌   |
| POST   | /api/auth/login     | Login & dapat token    | ❌   |
| GET    | /api/auth/me        | Info user saat ini     | ✅   |

### Tasks

| Method | Endpoint                | Deskripsi                    | Auth |
|--------|-------------------------|------------------------------|------|
| GET    | /api/tasks              | Ambil semua task (+ filter)  | ✅   |
| POST   | /api/tasks              | Buat task baru               | ✅   |
| GET    | /api/tasks/:id          | Detail satu task             | ✅   |
| PUT    | /api/tasks/:id          | Update task                  | ✅   |
| PUT    | /api/tasks/:id/status   | Update status saja           | ✅   |
| DELETE | /api/tasks/:id          | Hapus task                   | ✅   |

### Query Params untuk GET /api/tasks

| Param    | Nilai                         | Default     |
|----------|-------------------------------|-------------|
| status   | pending / in-progress / done  | -           |
| priority | low / medium / high           | -           |
| sort     | createdAt / dueDate / title   | createdAt   |
| order    | asc / desc                    | desc        |
| page     | integer                       | 1           |
| limit    | integer (max 100)             | 10          |

---

## Contoh Request

### Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Budi","email":"budi@example.com","password":"password123"}'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"budi@example.com","password":"password123"}'
```

### Buat Task

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Buat laporan","priority":"high","dueDate":"2024-12-31"}'
```

---

## Struktur Project

```
task-manager-api/
├── src/
│   ├── config/
│   │   ├── db.js           # Koneksi MongoDB
│   │   └── swagger.js      # Setup Swagger
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   └── task.controller.js
│   ├── middlewares/
│   │   ├── auth.middleware.js    # Verifikasi JWT
│   │   └── validate.middleware.js
│   ├── models/
│   │   ├── user.model.js
│   │   └── task.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   └── task.routes.js
│   └── app.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```
