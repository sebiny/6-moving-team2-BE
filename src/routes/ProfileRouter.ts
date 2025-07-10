import express from 'express';
import * as profileController from '../controllers/ProfileController';
import passport from '../config/passport';

const profileRouter = express.Router();

const authMiddleware = passport.authenticate('access-token', { session: false, failWithError: true });

// POST /profile/customer: 고객 프로필 생성
profileRouter.post('/customer', authMiddleware, profileController.createCustomerProfile);

// PATCH /profile/customer: 고객 프로필 수정
profileRouter.patch('/customer', authMiddleware, profileController.updateCustomerProfile);

// GET /profile/customer/:id: 고객 프로필 조회
profileRouter.get('/customer/:id', authMiddleware, profileController.getCustomerProfile);

// POST /profile/driver: 기사 프로필 생성
profileRouter.post('/driver', authMiddleware, profileController.createDriverProfile);

// PATCH /profile/driver: 기사 프로필 수정
profileRouter.patch('/driver', authMiddleware, profileController.updateDriverProfile);

// GET /profile/driver/:id: 기사 프로필 상세 조회
profileRouter.get('/driver/:id', authMiddleware, profileController.getDriverProfile);

export default profileRouter;
