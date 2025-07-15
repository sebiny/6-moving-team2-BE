import prisma from "../config/prisma";

export type EditDataType = {
  nickname?: string;
  career?: number;
  shortIntro?: string;
  detailIntro?: string;
  services?: string[];
  // serviceAreas?: string[];
};

async function getAllDrivers() {
  return await prisma.driver.findMany();
}

async function getDriverById(id: string) {
  return await prisma.driver.findUnique({ where: { id } });
}

async function updateDriver(id: string, data: EditDataType) {
  return await prisma.driver.update({ where: { id }, data });
}

export default {
  getAllDrivers,
  getDriverById,
  updateDriver
};
