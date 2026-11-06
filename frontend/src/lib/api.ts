import axios, { isAxiosError } from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
})

export const adminApi = axios.create({
  baseURL: api.defaults.baseURL,
  timeout: 12000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'ArcAdmin' },
})

export function apiErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    if (error.response?.data?.message) return String(error.response.data.message)
    if (!error.response) return 'We could not connect to the server. Please try again shortly.'
  }
  return fallback
}
