const Bus = require('../models/Bus');

// GET /api/buses
exports.getBuses = async (req, res) => {
  try {
    const buses = await Bus.find()
      .populate('assignedDriver', 'name phone')
      .populate('assignedRoute', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: buses.length, buses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/buses/:id
exports.getBus = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id)
      .populate('assignedDriver', 'name phone')
      .populate('assignedRoute', 'name stops');
    if (!bus) return res.status(404).json({ success: false, message: 'Bus not found.' });
    res.json({ success: true, bus });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/buses
exports.createBus = async (req, res) => {
  try {
    const { busNumber, plateNumber, capacity, model, color } = req.body;

    const existing = await Bus.findOne({ $or: [{ busNumber }, { plateNumber }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Bus number or plate number already exists.' });
    }

    const bus = await Bus.create({ busNumber, plateNumber, capacity, model, color });
    res.status(201).json({ success: true, message: 'Bus created successfully.', bus });
  } catch (error) {
    console.error('Create bus error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/buses/:id
exports.updateBus = async (req, res) => {
  try {
    const { busNumber, plateNumber, capacity, model, color, status } = req.body;

    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      { busNumber, plateNumber, capacity, model, color, status },
      { new: true, runValidators: true }
    );

    if (!bus) return res.status(404).json({ success: false, message: 'Bus not found.' });
    res.json({ success: true, message: 'Bus updated successfully.', bus });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// DELETE /api/buses/:id
exports.deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findByIdAndDelete(req.params.id);
    if (!bus) return res.status(404).json({ success: false, message: 'Bus not found.' });
    res.json({ success: true, message: 'Bus deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/buses/active   — returns buses with recent GPS data
exports.getActiveBuses = async (req, res) => {
  try {
    const buses = await Bus.find({ status: 'active' })
      .populate('assignedDriver', 'name phone')
      .populate('assignedRoute', 'name');
    res.json({ success: true, buses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/buses/stats
exports.getBusStats = async (req, res) => {
  try {
    const total    = await Bus.countDocuments();
    const active   = await Bus.countDocuments({ status: 'active' });
    const offline  = await Bus.countDocuments({ status: 'offline' });
    const maintenance = await Bus.countDocuments({ status: 'maintenance' });
    res.json({ success: true, stats: { total, active, offline, maintenance } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
