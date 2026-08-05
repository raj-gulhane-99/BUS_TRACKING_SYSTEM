const Bus          = require('../models/Bus');
const Assignment   = require('../models/Assignment');
const Notification = require('../models/Notification');
const { calculateETA, isWithinProximity } = require('../utils/etaCalculator');

// Track which students have already been notified (in-memory, resets on server restart)
const notifiedStudents = new Map(); // key: `${busId}-${studentId}`, value: timestamp

const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ─── Driver Events ────────────────────────────────────────────────────────

    /**
     * Driver joins their bus room and starts broadcasting location.
     * Event: driver:join  { busId, driverId }
     */
    socket.on('driver:join', async ({ busId, driverId }) => {
      socket.join(`bus:${busId}`);
      socket.join(`driver:${driverId}`);
      socket.data.busId    = busId;
      socket.data.driverId = driverId;
      socket.data.role     = 'driver';
      console.log(`🚌 Driver ${driverId} joined bus room: bus:${busId}`);
      io.emit('bus:status_changed', { busId, status: 'active' });
    });

    /**
     * Driver emits live GPS location.
     * Event: driver:location  { busId, driverId, lat, lng, speed, heading }
     */
    socket.on('driver:location', async (data) => {
      const { busId, driverId, lat, lng, speed = 0, heading = 0 } = data;

      // Persist to Bus document
      try {
        await Bus.findByIdAndUpdate(busId, {
          currentLocation: { lat, lng },
          currentSpeed: speed,
          lastUpdated: new Date(),
          status: 'active',
        });
      } catch (err) {
        console.error('Error updating bus location:', err.message);
      }

      const locationPayload = { busId, driverId, lat, lng, speed, heading, timestamp: new Date() };

      // Broadcast to admin room
      io.to('admin:room').emit('bus:location_update', locationPayload);

      // Broadcast to bus room (students subscribed)
      io.to(`bus:${busId}`).emit('bus:location_update', locationPayload);

      // ── Proximity check for each student on this bus ──────────────────────
      try {
        const assignment = await Assignment.findOne({ bus: busId, isActive: true })
          .populate('students', '_id');

        if (assignment && assignment.students.length > 0) {
          for (const student of assignment.students) {
            const studentSocketRoom = `student:${student._id}`;
            const cacheKey = `${busId}-${student._id}`;

            // Get student's saved location from socket data (student must emit student:location)
            const studentLoc = studentLocations.get(student._id.toString());
            if (!studentLoc) continue;

            const nearby = isWithinProximity({ lat, lng }, studentLoc, 500);
            const lastNotified = notifiedStudents.get(cacheKey) || 0;
            const cooldownMs = 5 * 60 * 1000; // 5 minutes cooldown

            if (nearby && Date.now() - lastNotified > cooldownMs) {
              notifiedStudents.set(cacheKey, Date.now());

              const etaData = calculateETA({ lat, lng, speed }, studentLoc);
              const message = `Your bus is arriving in approximately ${etaData.etaMinutes <= 1 ? '1 minute' : etaData.etaMinutes + ' minutes'}.`;

              // Emit real-time alert to student
              io.to(studentSocketRoom).emit('bus:nearby', {
                busId,
                distanceMeters: etaData.distanceMeters,
                etaMinutes: etaData.etaMinutes,
                message,
              });

              // Persist notification
              await Notification.create({
                recipient: student._id,
                bus: busId,
                type: 'proximity',
                title: '🚌 Bus Nearby!',
                message,
              });
            }

            // Emit ETA update regardless
            if (studentLoc) {
              const etaData = calculateETA({ lat, lng, speed }, studentLoc);
              io.to(studentSocketRoom).emit('bus:eta_update', etaData);
            }
          }
        }
      } catch (err) {
        console.error('Proximity check error:', err.message);
      }
    });

    /**
     * Driver starts trip
     * Event: driver:trip_start  { busId, driverId }
     */
    socket.on('driver:trip_start', async ({ busId, driverId }) => {
      try {
        await Bus.findByIdAndUpdate(busId, { status: 'active' });
        await Assignment.findOneAndUpdate({ bus: busId, isActive: true }, { startedAt: new Date() });

        io.emit('bus:trip_started', { busId, driverId, startedAt: new Date() });
        io.to('admin:room').emit('bus:trip_started', { busId, driverId });

        // Notify students
        const assignment = await Assignment.findOne({ bus: busId, isActive: true }).populate('students', '_id');
        if (assignment) {
          for (const student of assignment.students) {
            io.to(`student:${student._id}`).emit('trip:started', { busId, message: 'Your bus has started the trip!' });
            await Notification.create({
              recipient: student._id, bus: busId, type: 'trip_started',
              title: '🟢 Trip Started', message: 'Your bus has started the trip and is on its way!',
            });
          }
        }
      } catch (err) {
        console.error('Trip start error:', err.message);
      }
    });

    /**
     * Driver stops trip
     * Event: driver:trip_stop  { busId, driverId }
     */
    socket.on('driver:trip_stop', async ({ busId, driverId }) => {
      try {
        await Bus.findByIdAndUpdate(busId, { status: 'offline', currentSpeed: 0 });
        await Assignment.findOneAndUpdate({ bus: busId, isActive: true }, { endedAt: new Date() });

        io.emit('bus:trip_stopped', { busId, driverId });
        io.to('admin:room').emit('bus:status_changed', { busId, status: 'offline' });

        const assignment = await Assignment.findOne({ bus: busId }).populate('students', '_id');
        if (assignment) {
          for (const student of assignment.students) {
            io.to(`student:${student._id}`).emit('trip:ended', { busId, message: 'Trip has ended.' });
            await Notification.create({
              recipient: student._id, bus: busId, type: 'trip_ended',
              title: '🔴 Trip Ended', message: 'Your bus trip has ended for today.',
            });
          }
        }
      } catch (err) {
        console.error('Trip stop error:', err.message);
      }
    });

    /**
     * Driver emergency alert
     * Event: driver:emergency  { busId, driverId, message }
     */
    socket.on('driver:emergency', async ({ busId, driverId, message }) => {
      io.to('admin:room').emit('emergency:alert', { busId, driverId, message, timestamp: new Date() });
      console.log(`🚨 EMERGENCY from bus ${busId}: ${message}`);
    });

    // ─── Student Events ───────────────────────────────────────────────────────

    /**
     * Student subscribes to their bus
     * Event: student:join  { studentId, busId }
     */
    socket.on('student:join', ({ studentId, busId }) => {
      socket.join(`student:${studentId}`);
      socket.join(`bus:${busId}`);
      socket.data.studentId = studentId;
      socket.data.busId     = busId;
      socket.data.role      = 'student';
      console.log(`👤 Student ${studentId} subscribed to bus:${busId}`);
    });

    /**
     * Student shares their location for proximity detection
     * Event: student:location  { studentId, lat, lng }
     */
    socket.on('student:location', ({ studentId, lat, lng }) => {
      studentLocations.set(studentId, { lat, lng, updatedAt: new Date() });
    });

    // ─── Admin Events ─────────────────────────────────────────────────────────

    /**
     * Admin joins admin room to receive all bus updates
     * Event: admin:join  { adminId }
     */
    socket.on('admin:join', ({ adminId }) => {
      socket.join('admin:room');
      socket.data.adminId = adminId;
      socket.data.role    = 'admin';
      console.log(`👑 Admin ${adminId} joined admin room`);
    });

    // ─── Disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      const { role, busId, driverId } = socket.data;
      if (role === 'driver' && busId) {
        try {
          await Bus.findByIdAndUpdate(busId, { status: 'offline', currentSpeed: 0 });
          io.emit('bus:status_changed', { busId, status: 'offline' });
          console.log(`🔴 Driver disconnected, bus ${busId} set offline`);
        } catch (err) {
          console.error('Disconnect cleanup error:', err.message);
        }
      }
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });
};

// In-memory store for student locations (keyed by studentId string)
const studentLocations = new Map();

module.exports = { initializeSocket };
