const asyncHandler = require('../middleware/asyncHandler');
const Document = require('../models/Document');
const Task = require('../models/Task');

// @desc    Get all documents
// @route   GET /api/documents
// @access  Private
exports.getDocuments = asyncHandler(async (req, res, next) => {
  let query;

  if (req.user.role === 'admin') {
    // Admin can see all documents with user and task details
    query = Document.find()
      .populate('user', 'name email')
      .populate('task', 'title');
  } else {
    // Users can only see documents for their own tasks
    const userTasks = await Task.find({ user: req.user.id });
    const taskIds = userTasks.map(task => task._id);
    
    query = Document.find({ task: { $in: taskIds } })
      .populate('user', 'name email')
      .populate('task', 'title');
  }

  const documents = await query.sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: documents.length,
    data: documents
  });
});

// @desc    Get single document
// @route   GET /api/documents/:id
// @access  Private
exports.getDocument = asyncHandler(async (req, res, next) => {
  const document = await Document.findById(req.params.id)
    .populate('user', 'name email')
    .populate('task', 'title')
    .populate('auditLog.user', 'name email');

  if (!document) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  }

  // Check if user has access to this document
  if (req.user.role !== 'admin') {
    const task = await Task.findById(document.task);
    if (!task || task.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this document'
      });
    }
  }

  res.status(200).json({
    success: true,
    data: document
  });
});

// @desc    Upload document for task
// @route   POST /api/documents
// @access  Private
exports.uploadDocument = asyncHandler(async (req, res, next) => {
  const { name, fileUrl, task } = req.body;

  // Validate required fields
  if (!name || !fileUrl || !task) {
    return res.status(400).json({
      success: false,
      message: 'Please provide document name, file URL, and task'
    });
  }

  // Check if task exists and belongs to user
  const taskDoc = await Task.findById(task);
  
  if (!taskDoc) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }

  // Users can only upload documents to their own tasks
  if (taskDoc.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to add document to this task'
    });
  }

  // Create document
  const document = await Document.create({
    name,
    fileUrl,
    task,
    user: req.user.id
  });

  // Add creation to audit log
  document.auditLog.push({
    action: 'Created',
    user: req.user.id,
    notes: 'Document uploaded'
  });

  await document.save();

  // Populate the response
  await document.populate('user', 'name email');
  await document.populate('task', 'title');

  res.status(201).json({
    success: true,
    data: document
  });
});

// @desc    Update document status (Approve/Reject)
// @route   PUT /api/documents/:id/status
// @access  Private/Admin
exports.updateDocumentStatus = asyncHandler(async (req, res, next) => {
  const { status, notes } = req.body;

  // Validate status
  if (!status || !['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid status (Approved or Rejected)'
    });
  }

  let document = await Document.findById(req.params.id)
    .populate('user', 'name email')
    .populate('task', 'title');

  if (!document) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  }

  // Check if document is already processed
  if (document.status !== 'Pending') {
    return res.status(400).json({
      success: false,
      message: `Document has already been ${document.status.toLowerCase()}`
    });
  }

  // Update document status
  document.status = status;
  
  // Add to audit log
  document.auditLog.push({
    action: status,
    user: req.user.id,
    notes: notes || `Document ${status.toLowerCase()} by admin`
  });

  await document.save();

  // Populate audit log user details
  await document.populate('auditLog.user', 'name email');

  res.status(200).json({
    success: true,
    data: document,
    message: `Document ${status.toLowerCase()} successfully`
  });
});

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
exports.deleteDocument = asyncHandler(async (req, res, next) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  }

  // Check permissions
  if (req.user.role !== 'admin') {
    // Regular users can only delete their own documents
    const task = await Task.findById(document.task);
    if (!task || task.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this document'
      });
    }
  }

  await Document.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {},
    message: 'Document deleted successfully'
  });
});

// @desc    Get documents by task
// @route   GET /api/documents/task/:taskId
// @access  Private
exports.getDocumentsByTask = asyncHandler(async (req, res, next) => {
  const { taskId } = req.params;

  // Check if task exists and user has access
  const task = await Task.findById(taskId);
  
  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }

  if (req.user.role !== 'admin' && task.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access documents for this task'
    });
  }

  const documents = await Document.find({ task: taskId })
    .populate('user', 'name email')
    .populate('task', 'title')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: documents.length,
    data: documents
  });
});

// @desc    Get pending documents (Admin only)
// @route   GET /api/documents/pending
// @access  Private/Admin
exports.getPendingDocuments = asyncHandler(async (req, res, next) => {
  const pendingDocuments = await Document.find({ status: 'Pending' })
    .populate('user', 'name email')
    .populate('task', 'title')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: pendingDocuments.length,
    data: pendingDocuments
  });
});