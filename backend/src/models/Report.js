import mongoose from 'mongoose'

const attachmentSchema = new mongoose.Schema(
  {
    name: String,
    mimeType: String,
    dataUrl: String,
    size: Number,
    uploadedAt: Date
  },
  { _id: false }
)

const responseSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    advice: {
      type: String,
      required: true,
      trim: true
    },
    prescription: String,
    followUpDate: Date,
    respondedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
)

const reportSchema = new mongoose.Schema(
  {
    villager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    assignedDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    symptoms: {
      type: String,
      required: true,
      trim: true
    },
    diagnosis: {
      type: String,
      trim: true,
      default: ''
    },
    description: String,
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'emergency'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'active', 'resolved'],
      default: 'pending'
    },
    archivedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    location: {
      latitude: Number,
      longitude: Number,
      address: String,
      text: String
    },
    voiceMessage: {
      mimeType: String,
      dataUrl: String,
      uploadedAt: Date
    },
    attachments: [attachmentSchema],
    responses: [responseSchema]
  },
  { timestamps: true }
)

export const Report = mongoose.model('Report', reportSchema)
