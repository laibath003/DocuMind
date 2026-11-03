
export interface UploadedDocument {
  id: string
  filename: string
  status: string
  page_count: number
  file_size?: number
  error_message?: string | null
  created_at?: string
  signed_url?: string
}

const API_URL = import.meta.env.VITE_API_URL

export const uploadDocument = async (
  file: File,
  accessToken: string,
  conversationId: string
): Promise<UploadedDocument> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('conversationId', conversationId)

  const response = await fetch(`${API_URL}/documents/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || 'PDF upload failed')
  }

  return result.document
}
