import express, { Request, Response, NextFunction } from "express";
import driverController from "../controllers/driver.controller";
import passport from "../config/passport";

const driverPrivateRouter = express.Router();

const requiredAuth = passport.authenticate("access-token", { session: false, failWithError: true });

driverPrivateRouter.get("/estimate-requests/designated", requiredAuth, driverController.getDesignatedEstimateRequests);
driverPrivateRouter.get("/estimate-requests/available", requiredAuth, driverController.getAvailableEstimateRequests);
driverPrivateRouter.get("/estimate-requests", requiredAuth, driverController.getAllEstimateRequests);

driverPrivateRouter.post("/estimate-requests/:requestId/estimates", requiredAuth, driverController.createEstimate);

driverPrivateRouter.post("/estimate-requests/:requestId/reject", requiredAuth, driverController.rejectEstimateRequest);

driverPrivateRouter.get("/estimates", requiredAuth, driverController.getMyEstimates);

driverPrivateRouter.get("/estimates/:estimateId", requiredAuth, driverController.getEstimateDetail);

driverPrivateRouter.get("/estimate-requests/rejected", requiredAuth, driverController.getRejectedEstimateRequests);

export default driverPrivateRouter;
