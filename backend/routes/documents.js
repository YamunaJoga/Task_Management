const express = require('express');
const {
  getDocuments,
  getDocument,
  uploadDocument,
  updateDocumentStatus,
  deleteDocument,
  getDocumentsByTask,
  getPendingDocuments
} = require('../controllers/documents');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .get(getDocuments)
  .post(uploadDocument);

router.route('/pending')
  .get(authorize('admin'), getPendingDocuments);

router.route('/task/:taskId')
  .get(getDocumentsByTask);

router.route('/:id')
  .get(getDocument)
  .delete(deleteDocument);

router.put('/:id/status', authorize('admin'), updateDocumentStatus);

module.exports = router;