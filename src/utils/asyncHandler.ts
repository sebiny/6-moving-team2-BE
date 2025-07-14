import { Request, Response, NextFunction } from 'express';

type AsyncFunction<T = any> = (req: Request, res: Response, next: NextFunction) => Promise<T>;

export const asyncHandler =
  <T = any>(fn: AsyncFunction<T>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
