
import { Request, Response, NextFunction } from 'express'
import { supabase } from '../config/supabase.js'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
      }
    }
  }
}

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      })
      return
    }

    const token = authHeader.split(' ')[1]

    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data.user) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired access token',
      })
      return
    }

    req.user = {
      id: data.user.id,
    }

    next()
  } catch (error) {
    next(error)
  }
}
