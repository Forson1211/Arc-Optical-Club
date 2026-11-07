import { createServerlessHandler } from '../backend/dist/serverless.js'

// Explicit ESM entry point: the backend also uses native ES modules.
export default createServerlessHandler()
