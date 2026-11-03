
import { ExtractedPage } from './pdfParser.js'

export interface DocumentChunk {
  chunkIndex: number
  pageNumber: number
  content: string
}

const CHUNK_SIZE = 1000
const CHUNK_OVERLAP = 150

export const createChunks = (
  pages: ExtractedPage[]
): DocumentChunk[] => {
  const chunks: DocumentChunk[] = []

  for (const page of pages) {
    const text = page.content
    let start = 0

    while (start < text.length) {
      let end = Math.min(start + CHUNK_SIZE, text.length)

      if (end < text.length) {
        const lastSpace = text.lastIndexOf(' ', end)

        if (lastSpace > start + CHUNK_SIZE / 2) {
          end = lastSpace
        }
      }

      const content = text.slice(start, end).trim()

      if (content) {
        chunks.push({
          chunkIndex: chunks.length,
          pageNumber: page.pageNumber,
          content,
        })
      }

      if (end >= text.length) break

      start = Math.max(start + 1, end - CHUNK_OVERLAP)
    }
  }

  return chunks
}
