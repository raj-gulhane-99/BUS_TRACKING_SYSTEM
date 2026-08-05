const express   = require('express');
const router    = express.Router();
const auth      = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const {
  getRoutes, getRoute, createRoute, updateRoute, deleteRoute,
} = require('../controllers/routeController');

router.use(auth);
router.get('/',       authorize('admin', 'driver', 'student'), getRoutes);
router.get('/:id',    authorize('admin', 'driver', 'student'), getRoute);
router.post('/',      authorize('admin'), createRoute);
router.put('/:id',    authorize('admin'), updateRoute);
router.delete('/:id', authorize('admin'), deleteRoute);

module.exports = router;
