
import multer from 'multer'

export const uploadPdf = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 15 * 1024 * 1024,
  },

  fileFilter: (_req, file, callback) => {
    if (file.mimetype !== 'application/pdf') {
      callback(new Error('Only PDF files are allowed'))
      return
    }

    callback(null, true)
  },
})
