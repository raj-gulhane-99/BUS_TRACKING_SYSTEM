const Route = require('../models/Route');

// GET /api/routes
exports.getRoutes = async (req, res) => {
  try {
    const routes = await Route.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, count: routes.length, routes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/routes/:id
exports.getRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ success: false, message: 'Route not found.' });
    res.json({ success: true, route });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/routes
exports.createRoute = async (req, res) => {
  try {
    const { name, description, stops, polyline, totalDistance, estimatedTime } = req.body;

    const existing = await Route.findOne({ name });
    if (existing) return res.status(400).json({ success: false, message: 'Route name already exists.' });

    const route = await Route.create({ name, description, stops, polyline, totalDistance, estimatedTime });
    res.status(201).json({ success: true, message: 'Route created successfully.', route });
  } catch (error) {
    console.error('Create route error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/routes/:id
exports.updateRoute = async (req, res) => {
  try {
    const { name, description, stops, polyline, totalDistance, estimatedTime, isActive } = req.body;

    const route = await Route.findByIdAndUpdate(
      req.params.id,
      { name, description, stops, polyline, totalDistance, estimatedTime, isActive },
      { new: true, runValidators: true }
    );

    if (!route) return res.status(404).json({ success: false, message: 'Route not found.' });
    res.json({ success: true, message: 'Route updated successfully.', route });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// DELETE /api/routes/:id
exports.deleteRoute = async (req, res) => {
  try {
    const route = await Route.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!route) return res.status(404).json({ success: false, message: 'Route not found.' });
    res.json({ success: true, message: 'Route deactivated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
