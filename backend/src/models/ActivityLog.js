import mongoose from 'mongoose'

const activityLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    entityType: {
      type: String,
      required: true
    },
    entityId: {
      type: String,
      required: true
    },
    metadata: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
)

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema)
