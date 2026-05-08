import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: ['admin', 'doctor', 'villager'],
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLoginAt: Date
  },
  {
    timestamps: true
  }
)

userSchema.virtual('adminProfile', {
  ref: 'AdminProfile',
  localField: '_id',
  foreignField: 'user',
  justOne: true
})

userSchema.virtual('doctorProfile', {
  ref: 'DoctorProfile',
  localField: '_id',
  foreignField: 'user',
  justOne: true
})

userSchema.virtual('villagerProfile', {
  ref: 'VillagerProfile',
  localField: '_id',
  foreignField: 'user',
  justOne: true
})

userSchema.set('toObject', { virtuals: true })
userSchema.set('toJSON', { virtuals: true })

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash)
}

userSchema.statics.hashPassword = function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

export const User = mongoose.model('User', userSchema)

const adminProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    profilePicture: String,
    gender: String,
    dateOfBirth: String,
    address: String
  },
  { timestamps: true }
)

const doctorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    profilePicture: String,
    gender: String,
    dateOfBirth: String,
    address: String,
    specialization: {
      type: String,
      required: true,
      trim: true
    },
    licenseNumber: {
      type: String,
      required: true,
      trim: true
    }
  },
  { timestamps: true }
)

const villagerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    profilePicture: String,
    gender: String,
    dateOfBirth: String,
    address: String,
    village: {
      type: String,
      required: true,
      trim: true
    },
    medicalHistory: String
  },
  { timestamps: true }
)

export const AdminProfile = mongoose.model('AdminProfile', adminProfileSchema)
export const DoctorProfile = mongoose.model('DoctorProfile', doctorProfileSchema)
export const VillagerProfile = mongoose.model('VillagerProfile', villagerProfileSchema)
