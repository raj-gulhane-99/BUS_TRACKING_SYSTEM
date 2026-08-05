const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      default: null,
    },
    type: {
      type: String,
      enum: ['proximity', 'trip_started', 'trip_ended', 'emergency', 'general'],
      default: 'general',
    },
    title:   { type: String, required: true },
    message: { type: String, required: true },
    isRead:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for fast user notification queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
