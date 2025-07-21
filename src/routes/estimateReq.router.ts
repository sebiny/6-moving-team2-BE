import express from "express";
import passport from "passport";
import estimateReqController from "../controllers/estimateReq.controller";

const router = express.Router();

router.post(
  "/address",
  passport.authenticate("access-token", { session: false }),
  estimateReqController.linkCustomerAddress
);

router.get(
  "/address",
  passport.authenticate("access-token", { session: false }),
  estimateReqController.getCustomerAddressesByRole
);

router.post(
  "/estimate-request",
  passport.authenticate("access-token", { session: false }),
  estimateReqController.createEstimateRequest
);

router.post(
  "/estimate-request/designated",
  passport.authenticate("access-token", { session: false }),
  estimateReqController.createDesignatedEstimateRequest
);

export default router;
