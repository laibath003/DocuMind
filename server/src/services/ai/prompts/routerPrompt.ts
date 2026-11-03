export const buildRouterPrompt = (
  question: string,
  hasDocuments: boolean
): string => {
  return `
You are a search-mode classifier for an AI research assistant.

Choose exactly one search mode:

- "document": The question requires information specifically from the user's uploaded documents.
- "web": The question requires general knowledge, current information, recent events, or information that should be researched online.
- "hybrid": The question requires information from both uploaded documents and online research.

Rules:
1. If the question refers to uploaded files, their contents, or asks to summarize or compare them, prefer document search.
2. If the question asks about current events, latest information, or external facts, prefer web search.
3. If the question asks to compare uploaded material with external information, use hybrid search.
4. Do not choose document or hybrid when no documents are available.
5. When no documents are available, choose web.
6. Return only valid JSON. Do not include Markdown.

Documents available: ${hasDocuments ? 'Yes' : 'No'}

Question:
${question}

Return this exact JSON structure:
{
  "mode": "web",
  "reason": "Brief explanation for the decision"
}
`
}