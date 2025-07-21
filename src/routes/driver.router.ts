import express, { Request, Response, NextFunction } from "express";
import driverController from "../controllers/driver.controller";
import passport from "../config/passport";

const driverRouter = express.Router();

const optionalAuth = passport.authenticate("access-token", { session: false, failWithError: false });

driverRouter.get("/", optionalAuth, driverController.getAllDrivers);

driverRouter.get("/:id", optionalAuth, driverController.getDriverById);

driverRouter.get("/:id/reviews", driverController.getDriverReviews);

driverRouter.patch("/:id", driverController.updateDriver);

export default driverRouter;
