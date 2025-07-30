import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";

export const updateCompletedEstimates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentDate = new Date();

    // 이사일이 지난 APPROVED 또는 PENDING 견적들을 COMPLETED로 변경
    const updateResult = await prisma.estimateRequest.updateMany({
      where: {
        status: { in: ["APPROVED", "PENDING"] },
        moveDate: { lt: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()) }, // 오늘 자정 이전
        deletedAt: null
      },
      data: { status: "COMPLETED" }
    });

    // ACCEPTED 견적들은 그대로 유지 (EstimateStatus에 COMPLETED가 없음)
    // 완료 판단은 날짜 기준으로만 함
    // 업데이트된 견적이 있으면 로그 출력
    if (updateResult.count > 0) {
      console.log(`미들웨어에서 ${updateResult.count}개의 견적을 완료 처리했습니다.`);
    }
  } catch (error) {
    console.error("견적 완료 업데이트 실패:", error);
  }

  next();
};
