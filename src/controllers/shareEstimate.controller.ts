import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma";

const SHARE_SECRET = process.env.SHARE_JWT_SECRET || process.env.JWT_SECRET || "default_share_secret"; // 공유용 키

// 공유 링크 생성 (회원만 가능)
export const createShareLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const { estimateId } = req.params;

    // JWT 토큰 생성
    const token = jwt.sign({ estimateId }, SHARE_SECRET, { expiresIn: "7d" });

    // const baseUrl = "http://localhost:3000";
    const baseUrl = "https://www.moving-2.click";

    res.status(200).json({ shareUrl: `${baseUrl}/estimate/shared/${token}` });
  } catch (error) {
    res.status(500).json({ message: "공유 링크 생성 중 오류가 발생했습니다." });
  }
};

// 공유 링크 접근 (비회원 접근 허용)
export const getSharedEstimate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    // JWT 토큰 검증
    const decoded = jwt.verify(token, SHARE_SECRET) as { estimateId: string };

    // 견적 정보 조회 (고객 정보 포함)
    const estimate = await prisma.estimate.findUnique({
      where: { id: decoded.estimateId },
      include: {
        driver: {
          include: { authUser: true }
        },
        estimateRequest: {
          include: {
            customer: {
              include: { authUser: true }
            },
            fromAddress: true,
            toAddress: true
          }
        }
      }
    });

    if (!estimate) {
      res.status(404).json({ message: "해당 견적을 찾을 수 없습니다." });
    }

    res.status(200).json(estimate);
  } catch (error) {
    res.status(400).json({ message: "잘못되었거나 만료된 공유 링크입니다." });
  }
};

export default {
  createShareLink,
  getSharedEstimate
};
