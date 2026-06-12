const Task = require('../models/task.model');

// @desc  Ambil semua task milik user (dengan filter, sort, pagination)
// @route GET /api/tasks
const getTasks = async (req, res, next) => {
  try {
    const { status, priority, sort = 'createdAt', order = 'desc', page = 1, limit = 10 } = req.query;

    const filter = { user: req.user._id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const sortObj = { [sort]: order === 'asc' ? 1 : -1 };
    const skip = (Number(page) - 1) * Number(limit);

    const [tasks, total] = await Promise.all([
      Task.find(filter).sort(sortObj).skip(skip).limit(Number(limit)),
      Task.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Ambil satu task by ID
// @route GET /api/tasks/:id
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task tidak ditemukan.' });
    }
    res.json({ success: true, data: { task } });
  } catch (error) {
    next(error);
  }
};

// @desc  Buat task baru
// @route POST /api/tasks
const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;
    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate: dueDate || null,
      user: req.user._id,
    });
    res.status(201).json({ success: true, message: 'Task berhasil dibuat.', data: { task } });
  } catch (error) {
    next(error);
  }
};

// @desc  Update task
// @route PUT /api/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task tidak ditemukan.' });
    }
    res.json({ success: true, message: 'Task berhasil diupdate.', data: { task } });
  } catch (error) {
    next(error);
  }
};

// @desc  Update status task saja
// @route PUT /api/tasks/:id/status
const updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status },
      { new: true, runValidators: true }
    );
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task tidak ditemukan.' });
    }
    res.json({ success: true, message: `Status task diubah ke "${status}".`, data: { task } });
  } catch (error) {
    next(error);
  }
};

// @desc  Hapus task
// @route DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task tidak ditemukan.' });
    }
    res.json({ success: true, message: 'Task berhasil dihapus.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasks, getTaskById, createTask, updateTask, updateTaskStatus, deleteTask };
