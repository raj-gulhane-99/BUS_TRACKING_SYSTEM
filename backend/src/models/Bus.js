const mongoose = require('mongoose');

const busSchema = new mongoose.Schema(
  {
    busNumber: {
      type: String,
      required: [true, 'Bus number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    plateNumber: {
      type: String,
      required: [true, 'Plate number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    model: { type: String, trim: true, default: 'Standard' },
    color:  { type: String, trim: true, default: 'Yellow' },
    status: {
      type: String,
      enum: ['active', 'offline', 'maintenance'],
      default: 'offline',
    },
    currentLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    currentSpeed: { type: Number, default: 0 },
    lastUpdated:   { type: Date, default: null },
    assignedDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedRoute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Bus', busSchema);
