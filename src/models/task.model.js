const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Judul task wajib diisi'],
      trim: true,
      minlength: [3, 'Judul minimal 3 karakter'],
      maxlength: [100, 'Judul maksimal 100 karakter'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Deskripsi maksimal 500 karakter'],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'in-progress', 'done'],
        message: 'Status harus salah satu dari: pending, in-progress, done',
      },
      default: 'pending',
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: 'Priority harus salah satu dari: low, medium, high',
      },
      default: 'medium',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Index untuk query yang sering dipakai
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, priority: 1 });
taskSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Task', taskSchema);
