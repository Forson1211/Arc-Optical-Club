import { Schema, model } from 'mongoose'

const contactMessageSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  company: { type: String, trim: true, maxlength: 160 },
  phone: { type: String, trim: true, maxlength: 40 },
  email: { type: String, required: true, trim: true, lowercase: true },
  subject: { type: String, required: true, trim: true, maxlength: 180 },
  message: { type: String, required: true, trim: true, maxlength: 5000 },
  status: { type: String, enum: ['new', 'read', 'responded', 'archived'], default: 'new' },
}, { timestamps: true })

export const ContactMessage = model('ContactMessage', contactMessageSchema)
