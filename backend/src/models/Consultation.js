import mongoose from 'mongoose'

const consultationSchema = new mongoose.Schema(
  {
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      required: true,
      unique: true
    },
    villager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['active', 'scheduled', 'completed'],
      default: 'active'
    },
    lastMessage: {
      content: String,
      senderRole: {
        type: String,
        enum: ['doctor', 'patient']
      },
      timestamp: Date
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    scheduledAt: Date,
    completedAt: Date
  },
  { timestamps: true }
)

export const Consultation = mongoose.model('Consultation', consultationSchema)
