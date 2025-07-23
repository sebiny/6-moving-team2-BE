import express, { Request, Response, NextFunction } from "express";
import driverController from "../controllers/driver.controller";
import passport from "../config/passport";

const driverPrivateRouter = express.Router();

const requiredAuth = passport.authenticate("access-token", { session: false, failWithError: true });

driverPrivateRouter.get("/estimate-requests", requiredAuth, driverController.getEstimateRequestsForDriver);

driverPrivateRouter.post("/estimate-requests/:requestId/estimates", requiredAuth, driverController.createEstimate);

export default driverPrivateRouter;
