
import { createRequire } from 'node:module'

export interface ExtractedPage {
  pageNumber: number
  content: string
}

const require = createRequire(import.meta.url)
const pdf = require('pdf-parse') as typeof import('pdf-parse')

export const extractPdfText = async (
  buffer: Buffer
): Promise<ExtractedPage[]> => {
  const pages: ExtractedPage[] = []

  await pdf(buffer, {
    pagerender: async (pageData) => {
      const textContent = await pageData.getTextContent()

      const pageText = textContent.items
        .map((item: { str?: string }) => item.str ?? '')
        .join(' ')
        .trim()

      pages.push({
        pageNumber: pages.length + 1,
        content: pageText,
      })

      return pageText
    },
  })

  const validPages = pages.filter((page) => page.content.length > 0)

  if (validPages.length === 0) {
    throw new Error(
      'No readable text found. This PDF may contain scanned images.'
    )
  }

  return validPages
}
