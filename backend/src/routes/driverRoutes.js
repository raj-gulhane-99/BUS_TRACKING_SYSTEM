const express   = require('express');
const router    = express.Router();
const auth      = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const {
  getDrivers, getDriver, createDriver, updateDriver, deleteDriver, getMyAssignment,
} = require('../controllers/driverController');

router.use(auth);
router.get('/my-assignment', authorize('driver'), getMyAssignment);
router.get('/',         authorize('admin'), getDrivers);
router.get('/:id',      authorize('admin'), getDriver);
router.post('/',        authorize('admin'), createDriver);
router.put('/:id',      authorize('admin'), updateDriver);
router.delete('/:id',   authorize('admin'), deleteDriver);

module.exports = router;
