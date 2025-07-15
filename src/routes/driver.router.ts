import express from "express";
import driverController from "../controllers/driver.controller";

const driverRouter = express.Router();

driverRouter.get("/", driverController.getAllDrivers);

driverRouter.get("/:id", driverController.getDriverById);

driverRouter.patch("/:id", driverController.updateDriver);

export default driverRouter;
