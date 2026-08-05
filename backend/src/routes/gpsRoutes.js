const express   = require('express');
const router    = express.Router();
const auth      = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const {
  updateLocation, getActiveBuses, getBusLocation, getETA,
} = require('../controllers/gpsController');

router.use(auth);
router.post('/update',          authorize('driver', 'admin'), updateLocation);
router.get('/active-buses',     authorize('admin'), getActiveBuses);
router.get('/bus/:busId',       authorize('admin', 'driver', 'student'), getBusLocation);
router.get('/eta/:busId',       authorize('student', 'admin'), getETA);

module.exports = router;
