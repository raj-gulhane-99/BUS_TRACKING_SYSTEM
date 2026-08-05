const express   = require('express');
const router    = express.Router();
const auth      = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const {
  getAssignments, createAssignment, updateAssignment, deleteAssignment, getStats,
} = require('../controllers/assignmentController');

router.use(auth);
router.get('/stats',  authorize('admin'), getStats);
router.get('/',       authorize('admin'), getAssignments);
router.post('/',      authorize('admin'), createAssignment);
router.put('/:id',    authorize('admin'), updateAssignment);
router.delete('/:id', authorize('admin'), deleteAssignment);

module.exports = router;
