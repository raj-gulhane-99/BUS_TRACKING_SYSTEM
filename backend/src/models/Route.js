const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  lat:   { type: Number, required: true },
  lng:   { type: Number, required: true },
  order: { type: Number, required: true },
});

const routeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Route name is required'],
      unique: true,
      trim: true,
    },
    description: { type: String, trim: true },
    stops: [stopSchema],
    // Encoded polyline as array of [lat, lng] pairs
    polyline: [[Number]],
    totalDistance: { type: Number, default: 0 }, // in km
    estimatedTime: { type: Number, default: 0 },  // in minutes
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Route', routeSchema);
