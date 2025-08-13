// src/routes/review.router.ts
import express from "express";
import reviewController from "../controllers/review.controller";
import passport from "../config/passport";
import { cacheMiddleware } from "../middlewares/cacheMiddleware";

const router = express.Router();

// JWT 인증 미들웨어
const authMiddleware = passport.authenticate("access-token", {
  session: false,
  failWithError: true
});

// 작성 가능한 리뷰(견적)
router.get("/reviewable", authMiddleware, cacheMiddleware(300), reviewController.getAllCompletedEstimate);

// 리뷰 작성
router.post("/", authMiddleware, reviewController.createReview);

// 내가 쓴 리뷰
router.get("/mine", authMiddleware, cacheMiddleware(300), reviewController.getMyReviews);

// 리뷰 삭제
router.delete("/mine/:reviewId", authMiddleware, reviewController.deleteReview);

export default router;
