import { CustomError } from "../utils/customError";
import customerEstimateRepository from "../repositories/customerEstimate.repository";

// 대기 중인 견적 리스트 조회
export const getPendingEstimates = async (customerId: string) => {
  if (!customerId) throw new CustomError(400, "고객 ID가 누락되었습니다.");

  const result = await customerEstimateRepository.getPendingEstimatesByCustomerId(customerId);
  return result;
};

// 받았던 견적 리스트 조회
export const getReceivedEstimates = async (customerId: string) => {
  if (!customerId) {
    throw new CustomError(400, "고객 ID가 필요합니다.");
  }

  try {
    const result = await customerEstimateRepository.getReceivedEstimatesByCustomerId(customerId);
    return result;
  } catch (error: any) {
    console.error("받았던 견적 조회 중 오류:", error);
    throw new CustomError(500, error.message || "받았던 견적 조회 중 오류가 발생했습니다.");
  }
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

// 대기 중인 & 받았던 견적 리스트 상세 조회
export const getEstimateDetail = async (estimateId: string) => {
  if (!estimateId) throw new CustomError(400, "견적 ID가 누락되었습니다.");

  const estimate = await customerEstimateRepository.getEstimateDetailById(estimateId);
  if (!estimate) throw new CustomError(404, "견적 정보를 찾을 수 없습니다.");

  return estimate;
};

// 견적 ID로 기사/고객 ID 조회
// export const getCustomerAndDriverIdbyEstimateId = async (estimateId: string) => {
//   if (!estimateId) throw new CustomError(400, "견적 ID가 누락되었습니다.");

//   return await customerEstimateRepository.getCustomerAndDriverIdbyEstimateId(estimateId);
// };

export default {
  getEstimateDetail,
  acceptEstimate,
  getReceivedEstimates,
  getPendingEstimates
  // getCustomerAndDriverIdbyEstimateId
};
