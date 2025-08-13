import express, { Request, Response, NextFunction } from "express";
import driverController from "../controllers/driver.controller";
import passport from "../config/passport";
import { cacheMiddleware } from "../middlewares/cacheMiddleware";

const driverPrivateRouter = express.Router();

const requiredAuth = passport.authenticate("access-token", { session: false, failWithError: true });

driverPrivateRouter.get(
  "/estimate-requests/designated",
  requiredAuth,
  cacheMiddleware(300),
  driverController.getDesignatedEstimateRequests
);
driverPrivateRouter.get(
  "/estimate-requests/available",
  requiredAuth,
  cacheMiddleware(300),
  driverController.getAvailableEstimateRequests
);
driverPrivateRouter.get(
  "/estimate-requests",
  requiredAuth,
  cacheMiddleware(300),
  driverController.getAllEstimateRequests
);

driverPrivateRouter.post("/estimate-requests/:requestId/estimates", requiredAuth, driverController.createEstimate);

driverPrivateRouter.post("/estimate-requests/:requestId/reject", requiredAuth, driverController.rejectEstimateRequest);

driverPrivateRouter.get("/estimates", requiredAuth, cacheMiddleware(300), driverController.getMyEstimates);

driverPrivateRouter.get(
  "/estimates/:estimateId",
  requiredAuth,
  cacheMiddleware(300),
  driverController.getEstimateDetail
);

driverPrivateRouter.get(
  "/estimate-requests/rejected",
  requiredAuth,
  cacheMiddleware(300),
  driverController.getRejectedEstimateRequests
);

export default driverPrivateRouter;
