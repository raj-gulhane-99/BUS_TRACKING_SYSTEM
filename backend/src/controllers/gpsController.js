const GpsLocation = require('../models/GpsLocation');
const Bus         = require('../models/Bus');
const { calculateETA } = require('../utils/etaCalculator');

// POST /api/gps/update  — used by driver app or ESP32 hardware
exports.updateLocation = async (req, res) => {
  try {
    const { busId, driverId, lat, lng, speed = 0, heading = 0, accuracy = 0 } = req.body;

    if (!busId || lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'busId, lat, and lng are required.' });
    }

    // Save to GPS history
    const gpsRecord = await GpsLocation.create({
      bus: busId, driver: driverId || req.user?._id,
      lat, lng, speed, heading, accuracy,
    });

    // Update bus current location
    await Bus.findByIdAndUpdate(busId, {
      currentLocation: { lat, lng },
      currentSpeed: speed,
      lastUpdated: new Date(),
      status: 'active',
    });

    // Broadcast via Socket.IO if available
    if (req.io) {
      req.io.to('admin:room').emit('bus:location_update', {
        busId, lat, lng, speed, heading, timestamp: new Date(),
      });
      req.io.to(`bus:${busId}`).emit('bus:location_update', {
        busId, lat, lng, speed, heading, timestamp: new Date(),
      });
    }

    res.json({ success: true, message: 'Location updated.', record: gpsRecord });
  } catch (error) {
    console.error('GPS update error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/gps/active-buses   — admin: get all active buses with location
exports.getActiveBuses = async (req, res) => {
  try {
    const buses = await Bus.find({ status: 'active' })
      .populate('assignedDriver', 'name phone')
      .populate('assignedRoute', 'name stops polyline');
    res.json({ success: true, buses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/gps/bus/:busId     — get current location of a specific bus
exports.getBusLocation = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.busId)
      .populate('assignedDriver', 'name phone')
      .populate('assignedRoute', 'name stops polyline');

    if (!bus) return res.status(404).json({ success: false, message: 'Bus not found.' });

    res.json({
      success: true,
      location: bus.currentLocation,
      speed: bus.currentSpeed,
      status: bus.status,
      lastUpdated: bus.lastUpdated,
      bus,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/gps/eta/:busId?studentLat=x&studentLng=y
exports.getETA = async (req, res) => {
  try {
    const { studentLat, studentLng } = req.query;
    const bus = await Bus.findById(req.params.busId);

    if (!bus) return res.status(404).json({ success: false, message: 'Bus not found.' });
    if (!bus.currentLocation?.lat) {
      return res.json({ success: true, eta: null, message: 'Bus location not available.' });
    }

    const eta = calculateETA(
      { lat: bus.currentLocation.lat, lng: bus.currentLocation.lng, speed: bus.currentSpeed },
      { lat: parseFloat(studentLat), lng: parseFloat(studentLng) }
    );

    res.json({ success: true, eta, busStatus: bus.status });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
