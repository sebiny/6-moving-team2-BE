import express, { Request, Response, NextFunction } from "express";
import driverController from "../controllers/driver.controller";
import passport from "../config/passport";
import { cacheMiddleware } from "../middlewares/cacheMiddleware";

const driverRouter = express.Router();

const authMiddleware = passport.authenticate("access-token", { session: false, failWithError: false });

driverRouter.get("/auth", authMiddleware, cacheMiddleware(300), driverController.getAllDriversAuth);

driverRouter.get("/:id/auth", authMiddleware, cacheMiddleware(300), driverController.getDriverByIdAuth);

driverRouter.get("/", driverController.getAllDrivers);

driverRouter.get("/:id", driverController.getDriverById);

driverRouter.get("/:id/reviews", driverController.getDriverReviews);

export default driverRouter;
