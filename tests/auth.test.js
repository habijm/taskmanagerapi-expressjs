const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/user.model');

// Setup koneksi test DB
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/taskdb_test');
});

afterAll(async () => {
  await User.deleteMany({});
  await mongoose.connection.close();
});

describe('Auth API', () => {
  const userData = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  };

  // ─── Register ────────────────────────────────────────────
  describe('POST /api/auth/register', () => {
    it('harus berhasil register user baru', async () => {
      const res = await request(app).post('/api/auth/register').send(userData);
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe(userData.email);
    });

    it('harus gagal jika email sudah terdaftar', async () => {
      const res = await request(app).post('/api/auth/register').send(userData);
      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('harus gagal jika email tidak valid', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...userData, email: 'bukan-email' });
      expect(res.statusCode).toBe(422);
      expect(res.body.errors[0].field).toBe('email');
    });

    it('harus gagal jika password kurang dari 6 karakter', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...userData, email: 'new@example.com', password: '123' });
      expect(res.statusCode).toBe(422);
    });

    it('harus gagal jika nama tidak diisi', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'new2@example.com', password: 'password123' });
      expect(res.statusCode).toBe(422);
    });
  });

  // ─── Login ───────────────────────────────────────────────
  describe('POST /api/auth/login', () => {
    it('harus berhasil login dengan kredensial yang benar', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: userData.password });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
    });

    it('harus gagal dengan password salah', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: 'wrongpassword' });
      expect(res.statusCode).toBe(401);
    });

    it('harus gagal dengan email tidak terdaftar', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'tidakada@example.com', password: 'password123' });
      expect(res.statusCode).toBe(401);
    });
  });

  // ─── Get Me ──────────────────────────────────────────────
  describe('GET /api/auth/me', () => {
    let token;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: userData.password });
      token = res.body.data.token;
    });

    it('harus berhasil ambil profil dengan token valid', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.user.email).toBe(userData.email);
    });

    it('harus gagal tanpa token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
    });

    it('harus gagal dengan token palsu', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer tokenpalsu123');
      expect(res.statusCode).toBe(401);
    });
  });
});
