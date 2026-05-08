import jwt from 'jsonwebtoken'
import { AdminProfile, DoctorProfile, User, VillagerProfile } from '../models/User.js'
import { ActivityLog } from '../models/ActivityLog.js'
import { serializeUser } from './serializers.js'

const JWT_SECRET = process.env.JWT_SECRET || 'village-health-dev-secret'

export function createToken(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET)
}

export async function getUserProfile(user) {
  if (!user) return null

  if (user.role === 'doctor') {
    return DoctorProfile.findOne({ user: user._id })
  }

  if (user.role === 'villager') {
    return VillagerProfile.findOne({ user: user._id })
  }

  return AdminProfile.findOne({ user: user._id })
}

export async function buildAuthPayload(user) {
  const profile = await getUserProfile(user)
  return {
    token: createToken(user),
    user: serializeUser(user, profile)
  }
}

export async function recordActivity({ actor = null, action, entityType, entityId, metadata = {} }) {
  await ActivityLog.create({
    actor,
    action,
    entityType,
    entityId: String(entityId),
    metadata
  })
}

export async function createRoleProfile({ userId, role, profileData }) {
  if (role === 'doctor') {
    return DoctorProfile.create({
      user: userId,
      specialization: profileData.specialization,
      licenseNumber: profileData.licenseNumber,
      profilePicture: profileData.profilePicture,
      gender: profileData.gender,
      dateOfBirth: profileData.dateOfBirth,
      address: profileData.address
    })
  }

  if (role === 'villager') {
    return VillagerProfile.create({
      user: userId,
      village: profileData.village,
      medicalHistory: profileData.medicalHistory,
      profilePicture: profileData.profilePicture,
      gender: profileData.gender,
      dateOfBirth: profileData.dateOfBirth,
      address: profileData.address
    })
  }

  return AdminProfile.create({
    user: userId,
    profilePicture: profileData.profilePicture,
    gender: profileData.gender,
    dateOfBirth: profileData.dateOfBirth,
    address: profileData.address
  })
}

export async function findUserById(userId) {
  return User.findById(userId)
}
