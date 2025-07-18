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

export default {
  getAllDrivers,
  getDriverById,
  getDriverReviews,
  updateDriver
};
