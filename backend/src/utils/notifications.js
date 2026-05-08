import { Notification } from '../models/Notification.js'
import { User } from '../models/User.js'

export async function notifyUsersByRole(role, payload) {
  const users = await User.find({ role }).select('_id')
  if (!users.length) return []

  return Notification.insertMany(
    users.map((user) => ({
      user: user._id,
      ...payload
    }))
  )
}

export async function notifyUser(userId, payload) {
  return Notification.create({
    user: userId,
    ...payload
  })
}
