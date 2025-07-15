import { Request, Response, NextFunction } from "express";
import { CustomError } from "../utils/customError";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(err);

  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  res.status(500).json({ message: "서버 내부 오류가 발생했습니다." });
}
