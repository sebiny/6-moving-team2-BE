import driverRepository, { EditDataType, optionsType } from "../repositories/driver.repository";

async function getAllDrivers(options: optionsType, userId?: string) {
  return await driverRepository.getAllDrivers(options, userId);
}

async function getDriverById(id: string, userId?: string) {
  return await driverRepository.getDriverById(id, userId);
}

async function getDriverReviews(id: string, page: number) {
  return await driverRepository.getDriverReviews(id, page);
}

async function updateDriver(id: string, data: EditDataType) {
  return await driverRepository.updateDriver(id, data);
}

async function getEstimateRequestsForDriver(driverId: string) {
  return await driverRepository.getEstimateRequestsForDriver(driverId);
}

async function findEstimateByDriverAndRequest(driverId: string, estimateRequestId: string) {
  return await driverRepository.findEstimateByDriverAndRequest(driverId, estimateRequestId);
}

async function createEstimate(data: { driverId: string; estimateRequestId: string; price: number; comment?: string }) {
  return await driverRepository.createEstimate(data);
}

async function rejectEstimate(estimateId: string, reason: string) {
  return await driverRepository.rejectEstimate(estimateId, reason);
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
  getEstimateRequestsForDriver,
  findEstimateByDriverAndRequest,
  createEstimate,
  rejectEstimate,
  getMyEstimates,
  getEstimateDetail,
  getRejectedEstimateRequests
};
