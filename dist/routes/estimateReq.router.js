"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const estimateReq_controller_1 = __importDefault(require("../controllers/estimateReq.controller"));
const router = express_1.default.Router();
router.post("/address", estimateReq_controller_1.default.createAddress);
router
    .route("/customer/address")
    .post(estimateReq_controller_1.default.linkCustomerAddress)
    .get(estimateReq_controller_1.default.getCustomerAddressesByRole);
router.post("/customer/estimate-request", estimateReq_controller_1.default.createEstimateRequest);
exports.default = router;
//# sourceMappingURL=estimateReq.router.js.map