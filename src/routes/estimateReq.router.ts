import express from "express";
import passport from "passport";
import estimateReqController from "../controllers/estimateReq.controller";
import { cacheMiddleware } from "../middlewares/cacheMiddleware";

const router = express.Router();
const authMiddleware = passport.authenticate("access-token", { session: false, failWithError: true });

router.post("/address", authMiddleware, estimateReqController.linkCustomerAddress);

router.get("/address", authMiddleware, estimateReqController.getCustomerAddressesByRole);

router.post("/estimate-request", authMiddleware, estimateReqController.createEstimateRequest);

router.post("/estimate-request/designated", authMiddleware, estimateReqController.createDesignatedEstimateRequest);

router.get(
  "/estimate-request/active",
  authMiddleware,
  cacheMiddleware(300),
  estimateReqController.getActiveEstimateRequest
);

export default router;
