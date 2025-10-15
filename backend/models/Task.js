const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  status: {
    type: String,
    enum: ['To Do', 'In Progress', 'Done'],
    default: 'To Do'
  },
  dueDate: {
    type: Date,
    required: [true, 'Please add a due date']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    }
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
taskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for checking if task is overdue
taskSchema.virtual('isOverdue').get(function() {
  return this.dueDate < new Date() && this.status !== 'Done';
});

// Ensure virtual fields are serialized
taskSchema.set('toJSON', { virtuals: true });

// Create indexes for better performance
taskSchema.index({ location: '2dsphere' });
taskSchema.index({ user: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ assignedBy: 1 });
taskSchema.index({ createdAt: -1 });

// Middleware to cascade delete documents when task is deleted
taskSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  const Document = mongoose.model('Document');
  await Document.deleteMany({ task: this._id });
  next();
});

module.exports = mongoose.model('Task', taskSchema);