import { createContext } from 'react'

export type InitialContent = Record<string, unknown>
export const ContentContext = createContext<InitialContent>({})
