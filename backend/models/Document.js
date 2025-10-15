const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add document name'],
    trim: true,
    maxlength: [255, 'Document name cannot be more than 255 characters']
  },
  fileUrl: {
    type: String,
    required: [true, 'Please add file URL'],
    validate: {
      validator: function(url) {
        // Basic URL validation
        try {
          new URL(url);
          return true;
        } catch (error) {
          return false;
        }
      },
      message: 'Please provide a valid URL'
    }
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  task: {
    type: mongoose.Schema.ObjectId,
    ref: 'Task',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  auditLog: [{
    action: {
      type: String,
      enum: ['Created', 'Approved', 'Rejected'],
      required: true
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot be more than 500 characters']
    }
  }],
  fileType: {
    type: String,
    enum: ['pdf', 'doc', 'docx', 'txt', 'image', 'other'],
    default: 'other'
  },
  fileSize: {
    type: Number, // Size in bytes
    default: 0
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
documentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Auto-detect file type from URL extension
  if (this.fileUrl && this.isModified('fileUrl')) {
    const extension = this.fileUrl.split('.').pop().toLowerCase();
    const typeMap = {
      'pdf': 'pdf',
      'doc': 'doc',
      'docx': 'docx',
      'txt': 'txt',
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'image'
    };
    this.fileType = typeMap[extension] || 'other';
  }
  
  next();
});

// Virtual for formatted file size
documentSchema.virtual('formattedFileSize').get(function() {
  if (this.fileSize < 1024) return `${this.fileSize} B`;
  if (this.fileSize < 1048576) return `${(this.fileSize / 1024).toFixed(2)} KB`;
  return `${(this.fileSize / 1048576).toFixed(2)} MB`;
});

// Virtual for days since upload
documentSchema.virtual('daysSinceUpload').get(function() {
  const diffTime = Math.abs(new Date() - this.createdAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Ensure virtual fields are serialized
documentSchema.set('toJSON', { virtuals: true });

// Create indexes for better performance
documentSchema.index({ user: 1 });
documentSchema.index({ task: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ user: 1, status: 1 });
documentSchema.index({ task: 1, status: 1 });
documentSchema.index({ createdAt: -1 });
documentSchema.index({ updatedAt: -1 });
documentSchema.index({ 'auditLog.timestamp': -1 });

// Static method to get documents by status
documentSchema.statics.getByStatus = function(status) {
  return this.find({ status }).populate('user', 'name email').populate('task', 'title');
};

// Instance method to add audit entry
documentSchema.methods.addAuditEntry = function(action, userId, notes = '') {
  this.auditLog.push({
    action,
    user: userId,
    notes,
    timestamp: new Date()
  });
  return this.save();
};

// Middleware to validate that task exists and belongs to user
documentSchema.pre('save', async function(next) {
  if (this.isModified('task')) {
    const Task = mongoose.model('Task');
    const task = await Task.findById(this.task);
    
    if (!task) {
      throw new Error('Task not found');
    }
    
    // If document is being created, set the user to task's user
    if (this.isNew) {
      this.user = task.user;
    }
  }
  next();
});

module.exports = mongoose.model('Document', documentSchema);