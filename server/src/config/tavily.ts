
import { tavily } from '@tavily/core'

const apiKey = process.env.TAVILY_API_KEY

if (!apiKey) {
  throw new Error('Missing TAVILY_API_KEY environment variable')
}

export const tavilyClient = tavily({ apiKey })
