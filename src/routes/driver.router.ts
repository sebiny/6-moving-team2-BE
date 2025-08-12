import express, { Request, Response, NextFunction } from "express";
import driverController from "../controllers/driver.controller";
import passport from "../config/passport";
import { cacheMiddleware } from "../middlewares/cacheMiddleware";

const driverRouter = express.Router();

const authMiddleware = passport.authenticate("access-token", { session: false, failWithError: false });

driverRouter.get("/auth", authMiddleware, driverController.getAllDriversAuth);

driverRouter.get("/:id/auth", authMiddleware, driverController.getDriverByIdAuth);

driverRouter.get("/", cacheMiddleware(300), driverController.getAllDrivers);

driverRouter.get("/:id", cacheMiddleware(300), driverController.getDriverById);

driverRouter.get("/:id/reviews", cacheMiddleware(300), driverController.getDriverReviews);

export default driverRouter;
