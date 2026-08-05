const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Driver is required'],
    },
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      required: [true, 'Bus is required'],
    },
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: [true, 'Route is required'],
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isActive: { type: Boolean, default: true },
    startedAt: { type: Date, default: null },
    endedAt:   { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
