import express from "express";
import profileController from "../controllers/profile.controller";
import passport from "../config/passport";
import uploadMiddleware from "../middlewares/uploadMiddleware";

const profileRouter = express.Router();

const authMiddleware = passport.authenticate("access-token", { session: false, failWithError: true });

// POST /profile/image : 프로필 이미지 업로드 (단일 파일)
// form-data에서 'profileImage'라는 필드 이름으로 파일을 보내야 함함
profileRouter.post(
  "/image",
  authMiddleware,
  uploadMiddleware.single("profileImage"),
  profileController.uploadProfileImage
);

// POST /profile/customer: 고객 프로필 생성
profileRouter.post("/customer", authMiddleware, profileController.createCustomerProfile);

// PATCH /profile/customer: 고객 프로필 수정
profileRouter.patch("/customer", authMiddleware, profileController.updateCustomerProfile);

// GET /profile/customer/:id: 고객 프로필 조회
profileRouter.get("/customer/:id", authMiddleware, profileController.getCustomerProfile);

// POST /profile/driver: 기사 프로필 생성
profileRouter.post("/driver", authMiddleware, profileController.createDriverProfile);

// PATCH /profile/driver: 기사 프로필 수정
profileRouter.patch("/driver", authMiddleware, profileController.updateDriverProfile);

// GET /profile/driver/:id: 기사 프로필 상세 조회
profileRouter.get("/driver/:id", authMiddleware, profileController.getDriverProfile);

// PATCH /profile/driver/basic: 기사 프로필 기본 정보 수정
profileRouter.patch("/driver/basic", authMiddleware, profileController.updateDriverBasicProfile);

export default profileRouter;
