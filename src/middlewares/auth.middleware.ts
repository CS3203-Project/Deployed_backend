import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
const { verify } = jwt;

export default (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Token missing' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: Token missing' });
  }

  try {
    const decoded = verify(token as string, process.env.JWT_SECRET!);
    (req as any).user = decoded; // Add user info to request
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized: Token invalid' });
  }
};