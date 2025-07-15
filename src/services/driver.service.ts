import driverRepository, { EditDataType } from "../repositories/driver.repository";

async function getAllDrivers() {
  return await driverRepository.getAllDrivers();
}

async function getDriverById(id: string) {
  return await driverRepository.getDriverById(id);
}

async function updateDriver(id: string, data: EditDataType) {
  return await driverRepository.updateDriver(id, data);
}

export default {
  getAllDrivers,
  getDriverById,
  updateDriver
};
