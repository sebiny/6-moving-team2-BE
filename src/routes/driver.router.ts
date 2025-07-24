import express, { Request, Response, NextFunction } from "express";
import driverController from "../controllers/driver.controller";
import passport from "../config/passport";

const driverRouter = express.Router();

const authMiddleware = passport.authenticate("access-token", { session: false, failWithError: false });

driverRouter.get("/auth", authMiddleware, driverController.getAllDriversAuth);

driverRouter.get("/:id/auth", authMiddleware, driverController.getDriverByIdAuth);

driverRouter.get("/", driverController.getAllDrivers);

driverRouter.get("/:id", driverController.getDriverById);

driverRouter.get("/:id/reviews", driverController.getDriverReviews);

export default driverRouter;
