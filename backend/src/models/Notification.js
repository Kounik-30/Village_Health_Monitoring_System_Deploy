import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['emergency', 'new_report', 'consultation', 'system'],
      default: 'system'
    },
    read: {
      type: Boolean,
      default: false
    },
    data: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
)

export const Notification = mongoose.model('Notification', notificationSchema)
