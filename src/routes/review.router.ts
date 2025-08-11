// src/routes/review.router.ts
import express from "express";
import reviewController from "../controllers/review.controller";
import passport from "../config/passport";

const router = express.Router();

// JWT 인증 미들웨어
const authMiddleware = passport.authenticate("access-token", {
  session: false,
  failWithError: true
});

// 작성 가능한 리뷰(견적)
router.get("/reviewable", authMiddleware, reviewController.getAllCompletedEstimate);

// 리뷰 작성
router.post("/", authMiddleware, reviewController.createReview);

// 내가 쓴 리뷰
router.get("/mine", authMiddleware, reviewController.getMyReviews);

// 리뷰 삭제
router.delete("/mine/:reviewId", authMiddleware, reviewController.deleteReview);

export default router;
