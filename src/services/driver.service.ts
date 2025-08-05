import driverRepository, { optionsType } from "../repositories/driver.repository";
import estimateReqRepository from "../repositories/estimateReq.repository";

async function getAllDrivers(options: optionsType, userId?: string) {
  return await driverRepository.getAllDrivers(options, userId);
}

async function getDriverById(id: string, userId?: string) {
  const data = await driverRepository.getDriverById(id, userId);
  let isDesignated = false;
  if (userId) {
    const activeRequest = await estimateReqRepository.findActiveEstimateRequest(userId);
    if (activeRequest) {
      const alreadyDesignated = activeRequest.designatedDrivers?.some((d) => d.driverId === id);
      if (alreadyDesignated) isDesignated = true;
    }
  }
  return { ...data, isDesignated };
}

async function getDriverReviews(id: string, page: number) {
  return await driverRepository.getDriverReviews(id, page);
}

// 지정 견적요청 조회
async function getDesignatedEstimateRequests(driverId: string) {
  return await driverRepository.getDesignatedEstimateRequests(driverId);
}

// 일반 견적요청 조회
async function getAvailableEstimateRequests(driverId: string) {
  return await driverRepository.getAvailableEstimateRequests(driverId);
}

// 모든 견적요청 조회
async function getAllEstimateRequests(driverId: string) {
  return await driverRepository.getAllEstimateRequests(driverId);
}

// 견적 조회
async function findEstimateByDriverAndRequest(driverId: string, estimateRequestId: string) {
  return await driverRepository.findEstimateByDriverAndRequest(driverId, estimateRequestId);
}

// 견적 생성
async function createEstimate(data: { driverId: string; estimateRequestId: string; price: number; comment?: string }) {
  return await driverRepository.createEstimate(data);
}

// 내 견적 조회
async function getMyEstimates(driverId: string) {
  return await driverRepository.getMyEstimates(driverId);
}

// 견적 상세 조회
async function getEstimateDetail(driverId: string, estimateId: string) {
  return await driverRepository.getEstimateDetail(driverId, estimateId);
}

// 반려 견적요청 조회
async function getRejectedEstimateRequests(driverId: string) {
  return await driverRepository.getRejectedEstimateRequests(driverId);
}

// 응답 제한 확인
async function checkResponseLimit(estimateRequestId: string, driverId: string) {
  return await driverRepository.checkResponseLimit(estimateRequestId, driverId);
}

export default {
  getAllDrivers,
  getDriverById,
  getDriverReviews,
  getDesignatedEstimateRequests,
  getAvailableEstimateRequests,
  getAllEstimateRequests,
  findEstimateByDriverAndRequest,
  createEstimate,
  getMyEstimates,
  getEstimateDetail,
  getRejectedEstimateRequests,
  checkResponseLimit
};
