import mongoose from 'mongoose'

export const DATABASE_NAME = 'kounik_village_health_monitoring_system'

const DEFAULT_URI = `mongodb://127.0.0.1:27017/${DATABASE_NAME}`

export async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI || DEFAULT_URI

  await mongoose.connect(mongoUri, {
    dbName: DATABASE_NAME
  })

  return mongoose.connection
}
