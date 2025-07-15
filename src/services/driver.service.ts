import driverRepository, { EditDataType, optionsType } from "../repositories/driver.repository";

async function getAllDrivers(options: optionsType) {
  return await driverRepository.getAllDrivers(options);
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
