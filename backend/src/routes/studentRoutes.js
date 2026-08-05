const express   = require('express');
const router    = express.Router();
const auth      = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const {
  getStudents, getStudent, createStudent, updateStudent, deleteStudent, getMyAssignment,
} = require('../controllers/studentController');

router.use(auth);
router.get('/my-assignment', authorize('student'), getMyAssignment);
router.get('/',         authorize('admin'), getStudents);
router.get('/:id',      authorize('admin'), getStudent);
router.post('/',        authorize('admin'), createStudent);
router.put('/:id',      authorize('admin'), updateStudent);
router.delete('/:id',   authorize('admin'), deleteStudent);

module.exports = router;
