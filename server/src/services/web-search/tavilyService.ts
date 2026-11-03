import { tavilyClient } from '../../config/tavily.js'

export interface WebSearchResult {
  title: string
  url: string
  content: string
  publishedDate: string | null
}

export const searchWeb = async (
  query: string
): Promise<WebSearchResult[]> => {
  const response = await tavilyClient.search(query, {
    searchDepth: 'advanced',
    maxResults: 5,
    includeAnswer: false,
    includeRawContent: false,
    includePublishedDate: true,
  })

  return response.results.map((result) => ({
    title: result.title,
    url: result.url,
    content: result.content,
    publishedDate: result.publishedDate ?? null,
  }))
}