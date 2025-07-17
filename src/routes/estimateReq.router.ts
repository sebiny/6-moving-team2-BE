import express from "express";
import estimateReqController from "../controllers/estimateReq.controller";

const router = express.Router();

router.post("/address", estimateReqController.linkCustomerAddress);
router.get("/address", estimateReqController.getCustomerAddressesByRole);
router.post("/estimate-request", estimateReqController.createEstimateRequest);
// router.post("/customer/estimate-request/designated", estimateReqController.postDesignatedEstimateRequest);

export default router;
