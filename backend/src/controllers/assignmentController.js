const Assignment = require('../models/Assignment');
const Bus        = require('../models/Bus');

// GET /api/assignments
exports.getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate('driver', 'name email phone')
      .populate('bus', 'busNumber plateNumber status')
      .populate('route', 'name stops')
      .populate('students', 'name email studentId grade')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: assignments.length, assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/assignments
exports.createAssignment = async (req, res) => {
  try {
    const { driverId, busId, routeId, studentIds } = req.body;

    // Deactivate previous assignments for same bus or driver
    await Assignment.updateMany(
      { $or: [{ bus: busId }, { driver: driverId }], isActive: true },
      { isActive: false }
    );

    const assignment = await Assignment.create({
      driver: driverId,
      bus: busId,
      route: routeId,
      students: studentIds || [],
      isActive: true,
    });

    // Update bus with driver and route
    await Bus.findByIdAndUpdate(busId, {
      assignedDriver: driverId,
      assignedRoute: routeId,
    });

    const populated = await Assignment.findById(assignment._id)
      .populate('driver', 'name email phone')
      .populate('bus', 'busNumber plateNumber')
      .populate('route', 'name')
      .populate('students', 'name email studentId');

    res.status(201).json({ success: true, message: 'Assignment created successfully.', assignment: populated });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/assignments/:id
exports.updateAssignment = async (req, res) => {
  try {
    const { studentIds } = req.body;

    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      { students: studentIds },
      { new: true }
    ).populate('driver', 'name').populate('bus').populate('route').populate('students', 'name email');

    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });
    res.json({ success: true, message: 'Assignment updated.', assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// DELETE /api/assignments/:id
exports.deleteAssignment = async (req, res) => {
  try {
    await Assignment.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Assignment deactivated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/assignments/stats  — dashboard counts
exports.getStats = async (req, res) => {
  try {
    const User    = require('../models/User');
    const Bus     = require('../models/Bus');
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalDrivers  = await User.countDocuments({ role: 'driver' });
    const totalBuses    = await Bus.countDocuments();
    const activeBuses   = await Bus.countDocuments({ status: 'active' });
    const offlineBuses  = await Bus.countDocuments({ status: 'offline' });

    res.json({
      success: true,
      stats: { totalStudents, totalDrivers, totalBuses, activeBuses, offlineBuses },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
