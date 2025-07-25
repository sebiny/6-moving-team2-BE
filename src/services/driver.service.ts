import driverRepository, { EditDataType, optionsType } from "../repositories/driver.repository";
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

async function updateDriver(id: string, data: EditDataType) {
  return await driverRepository.updateDriver(id, data);
}

async function getDesignatedEstimateRequests(driverId: string) {
  return await driverRepository.getDesignatedEstimateRequests(driverId);
}

async function getAvailableEstimateRequests(driverId: string) {
  return await driverRepository.getAvailableEstimateRequests(driverId);
}

async function getAllEstimateRequests(driverId: string) {
  return await driverRepository.getAllEstimateRequests(driverId);
}

async function findEstimateByDriverAndRequest(driverId: string, estimateRequestId: string) {
  return await driverRepository.findEstimateByDriverAndRequest(driverId, estimateRequestId);
}

async function createEstimate(data: { driverId: string; estimateRequestId: string; price: number; comment?: string }) {
  return await driverRepository.createEstimate(data);
}

async function getMyEstimates(driverId: string) {
  return await driverRepository.getMyEstimates(driverId);
}

async function getEstimateDetail(driverId: string, estimateId: string) {
  return await driverRepository.getEstimateDetail(driverId, estimateId);
}

async function getRejectedEstimateRequests(driverId: string) {
  return await driverRepository.getRejectedEstimateRequests(driverId);
}

export default {
  getAllDrivers,
  getDriverById,
  getDriverReviews,
  updateDriver,
  getDesignatedEstimateRequests,
  getAvailableEstimateRequests,
  getAllEstimateRequests,
  findEstimateByDriverAndRequest,
  createEstimate,
  getMyEstimates,
  getEstimateDetail,
  getRejectedEstimateRequests
};
