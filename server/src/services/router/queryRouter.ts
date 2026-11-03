import { gemini } from '../../config/gemini.js'
import { buildRouterPrompt } from '../ai/prompts/routerPrompt.js'
import type { SearchMode, SearchModeDecision } from './searchMode.js'

export const routeQuery = async (
  question: string,
  hasDocuments: boolean
): Promise<SearchModeDecision> => {
  // Without uploaded documents, only web search is possible.
  if (!hasDocuments) {
    return {
      mode: 'web',
      reason: 'No uploaded documents are available.',
    }
  }

  const response = await gemini.models.generateContent({
    model: 'gemini-3.5-flash-lite',
    contents: buildRouterPrompt(question, hasDocuments),
    config: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  })

  const responseText = response.text

  if (!responseText) {
    throw new Error('Gemini returned an empty search-mode decision.')
  }

  let decision: { mode?: string; reason?: string }

  try {
    decision = JSON.parse(responseText)
  } catch {
    throw new Error('Gemini returned an invalid search-mode decision.')
  }

  const validModes: SearchMode[] = ['web', 'document', 'hybrid']

  if (!decision.mode || !validModes.includes(decision.mode as SearchMode)) {
    throw new Error('Gemini returned an unsupported search mode.')
  }

  const mode = decision.mode as SearchMode

  return {
    mode,
    reason: decision.reason?.trim() || 'Search mode selected by Gemini.',
  }
}