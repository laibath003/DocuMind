
import { gemini } from '../../config/gemini.js'

const EMBEDDING_MODEL = 'gemini-embedding-001'

export const generateEmbeddings = async (
  texts: string[]
): Promise<number[][]> => {
  const result = await gemini.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: texts,
    config: {
      outputDimensionality: 768,
    },
  })

  const embeddings = result.embeddings?.map(
    (item) => item.values ?? []
  )

  if (!embeddings || embeddings.length !== texts.length) {
    throw new Error('Failed to generate all embeddings')
  }

  return embeddings
}
