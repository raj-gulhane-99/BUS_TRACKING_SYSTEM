const mongoose = require('mongoose');

const gpsLocationSchema = new mongoose.Schema(
  {
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lat:     { type: Number, required: true },
    lng:     { type: Number, required: true },
    speed:   { type: Number, default: 0 },
    heading: { type: Number, default: 0 }, // degrees 0-360
    accuracy:{ type: Number, default: 0 }, // meters
  },
  { timestamps: true }
);

// TTL index: auto-delete GPS records older than 24 hours to save storage
gpsLocationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
// Index for efficient bus queries
gpsLocationSchema.index({ bus: 1, createdAt: -1 });

module.exports = mongoose.model('GpsLocation', gpsLocationSchema);
