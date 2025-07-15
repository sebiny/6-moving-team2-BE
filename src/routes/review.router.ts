// routes/review.routes.ts
import express from "express";
import reviewController from "../controllers/review.controller";

const router = express.Router();

router.route("/reviewable").get(reviewController.getAllCompletedEstimate);
router.route("/reviews").post(reviewController.createReview);
export default router;
