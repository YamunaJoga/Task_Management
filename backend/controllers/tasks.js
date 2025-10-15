const asyncHandler = require('../middleware/asyncHandler');
const Task = require('../models/Task');

// @desc    Get all tasks with role-based access
// @route   GET /api/tasks
// @access  Private
exports.getTasks = asyncHandler(async (req, res, next) => {
  // Check if user exists in request
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  let query;
  let populateFields = 'user assignedBy';

  if (req.user.role === 'admin') {
    // Admin can see all tasks with user information
    query = Task.find().populate(populateFields, 'name email role');
  } else {
    // Users can only see their own tasks
    query = Task.find({ user: req.user.id }).populate(populateFields, 'name email role');
  }

  const tasks = await query.sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks
  });
});

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  let task = await Task.findById(req.params.id)
    .populate('user', 'name email role')
    .populate('assignedBy', 'name email role');

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }

  // Check if user has access to this task
  if (req.user.role !== 'admin' && task.user._id.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this task'
    });
  }

  res.status(200).json({
    success: true,
    data: task
  });
});

// @desc    Create task
// @route   POST /api/tasks
// @access  Private
exports.createTask = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  // Add assignedBy field (who created the task)
  req.body.assignedBy = req.user.id;

  // If user field is not provided and current user is not admin, assign to self
  if (!req.body.user && req.user.role !== 'admin') {
    req.body.user = req.user.id;
  }

  // If user is provided but current user is not admin, they can only assign to themselves
  if (req.body.user && req.user.role !== 'admin' && req.body.user !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to assign tasks to other users'
    });
  }

  // Validate required fields
  const { title, description, dueDate, user } = req.body;
  
  if (!title || !description || !dueDate || !user) {
    return res.status(400).json({
      success: false,
      message: 'Please provide title, description, due date, and assign to user'
    });
  }

  // If location data provided, create GeoJSON point
  if (req.body.latitude && req.body.longitude) {
    req.body.location = {
      type: 'Point',
      coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
    };
  }

  try {
    const task = await Task.create(req.body);
    
    // Populate user and assignedBy fields in response
    await task.populate('user', 'name email role');
    await task.populate('assignedBy', 'name email role');

    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate field value entered'
      });
    }
    
    // Handle other errors
    res.status(500).json({
      success: false,
      message: 'Error creating task: ' + error.message
    });
  }
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  let task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }

  // Make sure user owns the task or is admin
  if (req.user.role !== 'admin' && task.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this task'
    });
  }

  // Regular users can only update status, not reassign tasks
  if (req.user.role !== 'admin' && req.body.user && req.body.user !== task.user.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to reassign tasks'
    });
  }

  // If location data provided, update GeoJSON point
  if (req.body.latitude && req.body.longitude) {
    req.body.location = {
      type: 'Point',
      coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
    };
  } else if (req.body.latitude === '' && req.body.longitude === '') {
    // Remove location if coordinates are empty
    req.body.location = undefined;
  }

  try {
    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
    .populate('user', 'name email role')
    .populate('assignedBy', 'name email role');

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating task: ' + error.message
    });
  }
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }

  // Make sure user owns the task or is admin
  // Users can delete their own tasks, admins can delete any task
  if (req.user.role !== 'admin' && task.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this task'
    });
  }

  await Task.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {},
    message: 'Task deleted successfully'
  });
});

// @desc    Get tasks within radius
// @route   GET /api/tasks/radius/:lat/:lng/:distance
// @access  Private
exports.getTasksInRadius = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  const { lat, lng, distance } = req.params;

  // Validate parameters
  if (!lat || !lng || !distance) {
    return res.status(400).json({
      success: false,
      message: 'Please provide latitude, longitude, and distance'
    });
  }

  // Calculate radius using radians
  // Divide distance by radius of Earth (6378 km)
  const radius = parseFloat(distance) / 6378;

  let query = {
    location: {
      $geoWithin: {
        $centerSphere: [[parseFloat(lng), parseFloat(lat)], radius]
      }
    }
  };

  // Non-admin users can only see their own tasks
  if (req.user.role !== 'admin') {
    query.user = req.user.id;
  }

  const tasks = await Task.find(query)
    .populate('user', 'name email role')
    .populate('assignedBy', 'name email role');

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks
  });
});

// @desc    Get tasks by user
// @route   GET /api/tasks/user/:userId
// @access  Private/Admin
exports.getTasksByUser = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  // Only admin can view tasks by specific user
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view tasks by user'
    });
  }

  const tasks = await Task.find({ user: req.params.userId })
    .populate('user', 'name email role')
    .populate('assignedBy', 'name email role')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks
  });
});

// @desc    Get my assigned tasks (for regular users)
// @route   GET /api/tasks/my-tasks
// @access  Private
exports.getMyTasks = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  const tasks = await Task.find({ user: req.user.id })
    .populate('user', 'name email role')
    .populate('assignedBy', 'name email role')
    .sort({ dueDate: 1 }); // Sort by due date ascending

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks
  });
});

// @desc    Update task status
// @route   PATCH /api/tasks/:id/status
// @access  Private
exports.updateTaskStatus = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  const { status } = req.body;

  if (!status || !['To Do', 'In Progress', 'Done'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid status'
    });
  }

  let task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found'
    });
  }

  // Make sure user owns the task or is admin
  if (req.user.role !== 'admin' && task.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this task'
    });
  }

  task = await Task.findByIdAndUpdate(
    req.params.id,
    { status },
    {
      new: true,
      runValidators: true
    }
  )
  .populate('user', 'name email role')
  .populate('assignedBy', 'name email role');

  res.status(200).json({
    success: true,
    data: task,
    message: 'Task status updated successfully'
  });
});