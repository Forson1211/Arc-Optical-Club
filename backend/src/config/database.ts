import mongoose from 'mongoose'

export async function connectDatabase() {
  mongoose.set('bufferCommands', false)
  if (mongoose.connection.readyState === 1) return
  const uri = process.env.MONGODB_URI
  if (!uri) {
    if (process.env.NODE_ENV === 'production') throw new Error('Set MONGODB_URI before starting the production API.')
    console.log('MONGODB_URI is not set. Using persistent local development storage.')
    return
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000, maxPoolSize: 5 })
  console.log('MongoDB connected')
}
