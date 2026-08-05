const express   = require('express');
const router    = express.Router();
const auth      = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const {
  getBuses, getBus, createBus, updateBus, deleteBus, getActiveBuses, getBusStats,
} = require('../controllers/busController');

router.use(auth);
router.get('/active', authorize('admin', 'driver', 'student'), getActiveBuses);
router.get('/stats',  authorize('admin'), getBusStats);
router.get('/',       authorize('admin', 'driver', 'student'), getBuses);
router.get('/:id',    authorize('admin', 'driver', 'student'), getBus);
router.post('/',      authorize('admin'), createBus);
router.put('/:id',    authorize('admin'), updateBus);
router.delete('/:id', authorize('admin'), deleteBus);

module.exports = router;
