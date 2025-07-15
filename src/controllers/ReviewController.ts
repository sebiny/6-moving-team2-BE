import { Request, Response } from 'express';
import { getAllCompleted } from '../services/ReviewService';

export const getAllCompletedController = async (req: Request, res: Response): Promise<Response<any>> => {
  try {
    const data = await getAllCompleted();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: '서버요청오류' });
  }
};
