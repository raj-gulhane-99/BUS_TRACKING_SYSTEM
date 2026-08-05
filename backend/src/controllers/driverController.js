const User       = require('../models/User');
const Assignment = require('../models/Assignment');
const Bus        = require('../models/Bus');

// GET /api/drivers
exports.getDrivers = async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver' }).sort({ createdAt: -1 });
    res.json({ success: true, count: drivers.length, drivers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/drivers/:id
exports.getDriver = async (req, res) => {
  try {
    const driver = await User.findOne({ _id: req.params.id, role: 'driver' });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found.' });
    res.json({ success: true, driver });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/drivers
exports.createDriver = async (req, res) => {
  try {
    const { name, email, password, phone, licenseNumber, experience } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered.' });

    const driver = await User.create({
      name, email, password: password || 'driver123',
      role: 'driver', phone, licenseNumber, experience,
    });

    res.status(201).json({ success: true, message: 'Driver created successfully.', driver });
  } catch (error) {
    console.error('Create driver error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already exists.' });
    }
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/drivers/:id
exports.updateDriver = async (req, res) => {
  try {
    const { name, email, phone, licenseNumber, experience, isActive } = req.body;

    const driver = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'driver' },
      { name, email, phone, licenseNumber, experience, isActive },
      { new: true, runValidators: true }
    );

    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found.' });
    res.json({ success: true, message: 'Driver updated successfully.', driver });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// DELETE /api/drivers/:id
exports.deleteDriver = async (req, res) => {
  try {
    const driver = await User.findOneAndDelete({ _id: req.params.id, role: 'driver' });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found.' });
    res.json({ success: true, message: 'Driver deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/drivers/my-assignment  (for driver role)
exports.getMyAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({ driver: req.user._id, isActive: true })
      .populate('bus')
      .populate('route')
      .populate('students', 'name phone studentId grade');

    res.json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
