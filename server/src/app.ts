
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import documentRoutes from './routes/documentRoutes.js'

const app = express()

app.use(helmet())

app.use(
  cors({
    origin: 'http://localhost:5173',
  })
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))
app.use('/api/documents', documentRoutes)

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'DocuMind API is running!',
  })
})

export default app
