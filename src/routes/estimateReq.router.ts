import express from "express";
import estimateReqController from "../controllers/estimateReq.controller";

const router = express.Router();

router.post("/address", estimateReqController.createAddress);
router
  .route("/customer/address")
  .post(estimateReqController.linkCustomerAddress)
  .get(estimateReqController.getCustomerAddressesByRole);
router.post("/customer/estimate-request", estimateReqController.createEstimateRequest);

export default router;
