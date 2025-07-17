"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/review.routes.ts
const express_1 = __importDefault(require("express"));
const review_controller_1 = __importDefault(require("../controllers/review.controller"));
const router = express_1.default.Router();
router.route("/reviewable").get(review_controller_1.default.getAllCompletedEstimate);
router.route("/reviews").post(review_controller_1.default.createReview);
exports.default = router;
//# sourceMappingURL=review.router.js.map