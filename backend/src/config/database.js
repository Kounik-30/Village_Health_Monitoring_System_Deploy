import mongoose from 'mongoose'

export async function connectDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI

    if (!mongoUri) {
      throw new Error("❌ MONGODB_URI not found in .env")
    }

    await mongoose.connect(mongoUri)

    console.log("✅ MongoDB connected successfully")

    return mongoose.connection

  } catch (error) {
    console.error("❌ MongoDB connection error:", error)
    process.exit(1)
  }
}