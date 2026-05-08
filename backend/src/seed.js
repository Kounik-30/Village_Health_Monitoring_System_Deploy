import { AdminProfile, DoctorProfile, User, VillagerProfile } from './models/User.js'

export async function seedDefaultUsers() {
  await User.deleteMany({})

  const passwordHash = await User.hashPassword('Password')

  const villager = await User.create({
    email: 'villager@test.com',
    passwordHash,
    fullName: 'Ram Kumar',
    phoneNumber: '+91-9876543210',
    role: 'villager'
  })

  await VillagerProfile.create({
    user: villager._id,
    village: 'Rampur'
  })

  const doctor = await User.create({
    email: 'doctor@test.com',
    passwordHash,
    fullName: 'Dr. Priya Sharma',
    phoneNumber: '+91-9876543211',
    role: 'doctor'
  })

  await DoctorProfile.create({
    user: doctor._id,
    specialization: 'General Medicine',
    licenseNumber: 'MED12345'
  })

  const admin = await User.create({
    email: 'admin@test.com',
    passwordHash,
    fullName: 'Admin User',
    phoneNumber: '+91-9876543212',
    role: 'admin'
  })

  await AdminProfile.create({
    user: admin._id
  })
}