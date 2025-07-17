import { EstimateStatus } from "@prisma/client";
import { CustomError } from "../utils/customError";
import customerEstimateRepository from "../repositories/customerEstimate.repository";

// 대기 중인 견적 리스트 조회
export const getEstimatesByCustomer = async (customerId: string, status: EstimateStatus) => {
  if (!customerId) throw new CustomError(400, "고객 ID가 누락되었습니다.");
  if (!status) throw new CustomError(400, "견적 상태가 누락되었습니다.");

  const estimates = await customerEstimateRepository.getEstimatesByCustomerIdAndStatus(customerId, status);

  return estimates;
};

// 대기 중인 견적 리스트 상세 조회
export const getEstimateDetail = async (estimateId: string) => {
  if (!estimateId) throw new CustomError(400, "견적 ID가 누락되었습니다.");

  const estimate = await customerEstimateRepository.getEstimateDetailById(estimateId);
  if (!estimate) throw new CustomError(404, "견적 정보를 찾을 수 없습니다.");

  return estimate;
};

// 견적 확정하기
export const acceptEstimate = async (estimateId: string) => {
  if (!estimateId) {
    throw new CustomError(400, "견적 ID가 필요합니다.");
  }

  try {
    const result = await customerEstimateRepository.acceptEstimateById(estimateId);
    return result;
  } catch (error: any) {
    console.error("견적 확정 중 오류:", error);

    // 이미 CustomError라면 그대로 던지고, 아니면 새로 감싸서 던짐
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError(500, error.message || "견적 확정 중 알 수 없는 오류가 발생했습니다.");
  }
};

export default {
  getEstimatesByCustomer,
  getEstimateDetail,
  acceptEstimate
};
