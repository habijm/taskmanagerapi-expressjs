const express = require('express');
const { body, query } = require('express-validator');
const {
  getTasks, getTaskById, createTask, updateTask, updateTaskStatus, deleteTask,
} = require('../controllers/task.controller');
const { protect } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');

const router = express.Router();

// Semua route di bawah butuh JWT
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Manajemen task (semua endpoint butuh JWT)
 */

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Ambil semua task milik user
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in-progress, done]
 *         description: Filter berdasarkan status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filter berdasarkan priority
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [createdAt, dueDate, priority, title]
 *           default: createdAt
 *         description: Field untuk sorting
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Daftar task berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     tasks:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Task' }
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total: { type: integer }
 *                         page: { type: integer }
 *                         limit: { type: integer }
 *                         totalPages: { type: integer }
 *       401:
 *         description: Tidak terautentikasi
 */
router.get(
  '/',
  [
    query('status').optional().isIn(['pending', 'in-progress', 'done']).withMessage('Status tidak valid'),
    query('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority tidak valid'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page harus angka positif'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit harus antara 1-100'),
  ],
  validate,
  getTasks
);

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Buat task baru
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Buat laporan bulanan
 *               description:
 *                 type: string
 *                 example: Rekap data penjualan Q4
 *               status:
 *                 type: string
 *                 enum: [pending, in-progress, done]
 *                 default: pending
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: medium
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-12-31"
 *     responses:
 *       201:
 *         description: Task berhasil dibuat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     task: { $ref: '#/components/schemas/Task' }
 *       422:
 *         description: Validasi gagal
 */
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Judul wajib diisi').isLength({ min: 3, max: 100 }).withMessage('Judul harus 3-100 karakter'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Deskripsi maksimal 500 karakter'),
    body('status').optional().isIn(['pending', 'in-progress', 'done']).withMessage('Status tidak valid'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority tidak valid'),
    body('dueDate').optional().isISO8601().withMessage('Format tanggal tidak valid (gunakan YYYY-MM-DD)'),
  ],
  validate,
  createTask
);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Ambil detail satu task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID task
 *     responses:
 *       200:
 *         description: Detail task
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     task: { $ref: '#/components/schemas/Task' }
 *       404:
 *         description: Task tidak ditemukan
 */
router.get('/:id', getTaskById);

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status:
 *                 type: string
 *                 enum: [pending, in-progress, done]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *               dueDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Task berhasil diupdate
 *       404:
 *         description: Task tidak ditemukan
 */
router.put(
  '/:id',
  [
    body('title').optional().trim().isLength({ min: 3, max: 100 }).withMessage('Judul harus 3-100 karakter'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Deskripsi maksimal 500 karakter'),
    body('status').optional().isIn(['pending', 'in-progress', 'done']).withMessage('Status tidak valid'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority tidak valid'),
    body('dueDate').optional().isISO8601().withMessage('Format tanggal tidak valid'),
  ],
  validate,
  updateTask
);

/**
 * @swagger
 * /api/tasks/{id}/status:
 *   put:
 *     summary: Update status task saja
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, in-progress, done]
 *                 example: done
 *     responses:
 *       200:
 *         description: Status berhasil diupdate
 *       404:
 *         description: Task tidak ditemukan
 */
router.put(
  '/:id/status',
  [
    body('status').isIn(['pending', 'in-progress', 'done']).withMessage('Status tidak valid'),
  ],
  validate,
  updateTaskStatus
);

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Hapus task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task berhasil dihapus
 *       404:
 *         description: Task tidak ditemukan
 */
router.delete('/:id', deleteTask);

module.exports = router;
