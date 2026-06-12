const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/user.model');
const Task = require('../src/models/task.model');

let token;
let taskId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/taskdb_test');

  // Buat user & login untuk dapat token
  await User.deleteMany({});
  await Task.deleteMany({});

  await request(app).post('/api/auth/register').send({
    name: 'Task Tester',
    email: 'tasktest@example.com',
    password: 'password123',
  });

  const res = await request(app).post('/api/auth/login').send({
    email: 'tasktest@example.com',
    password: 'password123',
  });
  token = res.body.data.token;
});

afterAll(async () => {
  await User.deleteMany({});
  await Task.deleteMany({});
  await mongoose.connection.close();
});

describe('Task API', () => {
  // ─── Create Task ─────────────────────────────────────────
  describe('POST /api/tasks', () => {
    it('harus berhasil membuat task baru', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Task pertama', description: 'Ini deskripsi', priority: 'high' });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.title).toBe('Task pertama');
      expect(res.body.data.task.status).toBe('pending'); // default
      taskId = res.body.data.task._id;
    });

    it('harus gagal tanpa title', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Tanpa judul' });
      expect(res.statusCode).toBe(422);
    });

    it('harus gagal dengan status tidak valid', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Task valid', status: 'invalid-status' });
      expect(res.statusCode).toBe(422);
    });

    it('harus gagal tanpa token', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Task tanpa auth' });
      expect(res.statusCode).toBe(401);
    });
  });

  // ─── Get All Tasks ───────────────────────────────────────
  describe('GET /api/tasks', () => {
    beforeAll(async () => {
      // Tambah beberapa task untuk filter test
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Task done', status: 'done', priority: 'low' });

      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Task in progress', status: 'in-progress', priority: 'medium' });
    });

    it('harus berhasil ambil semua task', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.tasks.length).toBeGreaterThan(0);
      expect(res.body.data.pagination).toHaveProperty('total');
    });

    it('harus bisa filter berdasarkan status', async () => {
      const res = await request(app)
        .get('/api/tasks?status=done')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      res.body.data.tasks.forEach((t) => expect(t.status).toBe('done'));
    });

    it('harus bisa filter berdasarkan priority', async () => {
      const res = await request(app)
        .get('/api/tasks?priority=high')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      res.body.data.tasks.forEach((t) => expect(t.priority).toBe('high'));
    });

    it('harus bisa pagination', async () => {
      const res = await request(app)
        .get('/api/tasks?page=1&limit=2')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.tasks.length).toBeLessThanOrEqual(2);
      expect(res.body.data.pagination.limit).toBe(2);
    });

    it('harus gagal dengan status filter tidak valid', async () => {
      const res = await request(app)
        .get('/api/tasks?status=salah')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(422);
    });
  });

  // ─── Get Task By ID ──────────────────────────────────────
  describe('GET /api/tasks/:id', () => {
    it('harus berhasil ambil task by ID', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.task._id).toBe(taskId);
    });

    it('harus 404 untuk ID yang tidak ada', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(404);
    });
  });

  // ─── Update Task ─────────────────────────────────────────
  describe('PUT /api/tasks/:id', () => {
    it('harus berhasil update task', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Task diupdate', priority: 'low' });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.task.title).toBe('Task diupdate');
      expect(res.body.data.task.priority).toBe('low');
    });

    it('harus 404 jika task tidak ditemukan', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Update gagal' });
      expect(res.statusCode).toBe(404);
    });
  });

  // ─── Update Status ───────────────────────────────────────
  describe('PUT /api/tasks/:id/status', () => {
    it('harus berhasil update status task', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'in-progress' });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.task.status).toBe('in-progress');
    });

    it('harus gagal dengan status tidak valid', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'dikerjakan' });
      expect(res.statusCode).toBe(422);
    });
  });

  // ─── Delete Task ─────────────────────────────────────────
  describe('DELETE /api/tasks/:id', () => {
    it('harus berhasil hapus task', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('harus 404 setelah task dihapus', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toBe(404);
    });
  });
});
