const express = require('express');
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getTasksInRadius,
  getTasksByUser,
  getMyTasks,
  updateTaskStatus
} = require('../controllers/tasks');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/my-tasks')
  .get(getMyTasks);

router.route('/user/:userId')
  .get(authorize('admin'), getTasksByUser);

router.route('/radius/:lat/:lng/:distance')
  .get(getTasksInRadius);

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

router.route('/:id/status')
  .patch(updateTaskStatus);

module.exports = router;