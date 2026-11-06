import 'dotenv/config'
import { createInterface } from 'node:readline/promises'
import { emitKeypressEvents } from 'node:readline'
import mongoose from 'mongoose'
import { connectDatabase } from '../config/database.js'
import { createAdmin } from '../lib/auth.js'
import { initializeStorage } from '../lib/store.js'
import { email as emailSchema } from '../lib/validation.js'

async function secret(prompt: string): Promise<string> {
  if (!process.stdin.isTTY) throw new Error('Run this command in an interactive terminal to enter your password privately.')
  process.stdout.write(prompt)
  emitKeypressEvents(process.stdin)
  process.stdin.setRawMode(true)
  process.stdin.resume()
  return new Promise((resolve, reject) => {
    let value = ''
    const done = () => { process.stdin.setRawMode(false); process.stdin.off('keypress', keypress); process.stdout.write('\n') }
    const keypress = (text: string, key: { name?: string; ctrl?: boolean }) => {
      if (key.ctrl && key.name === 'c') { done(); reject(new Error('Setup cancelled.')); return }
      if (key.name === 'return') { done(); resolve(value); return }
      if (key.name === 'backspace') { value = value.slice(0, -1); return }
      if (text && !key.ctrl && !/[\x00-\x1f\x7f]/.test(text)) value += text
    }
    process.stdin.on('keypress', keypress)
  })
}

try {
  console.log('Create an Arc Optical Club administrator. Password input is hidden.')
  const prompt = createInterface({ input: process.stdin, output: process.stdout })
  const email = emailSchema.parse(await prompt.question('Admin email: '))
  prompt.close()
  const password = await secret('Password (at least 12 characters): ')
  const confirmation = await secret('Confirm password: ')
  if (password !== confirmation) throw new Error('Passwords do not match. No account was created.')
  await connectDatabase()
  await initializeStorage()
  await createAdmin(email, password)
  console.log('Administrator created. You can now sign in at /admin.')
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Could not create the administrator.')
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
  process.stdin.pause()
}
