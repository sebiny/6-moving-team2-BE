"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const profile_controller_1 = __importDefault(require("../controllers/profile.controller"));
const passport_1 = __importDefault(require("../config/passport"));
const profileRouter = express_1.default.Router();
const authMiddleware = passport_1.default.authenticate("access-token", { session: false, failWithError: true });
// POST /profile/customer: 고객 프로필 생성
profileRouter.post("/customer", authMiddleware, profile_controller_1.default.createCustomerProfile);
// PATCH /profile/customer: 고객 프로필 수정
profileRouter.patch("/customer", authMiddleware, profile_controller_1.default.updateCustomerProfile);
// GET /profile/customer/:id: 고객 프로필 조회
profileRouter.get("/customer/:id", authMiddleware, profile_controller_1.default.getCustomerProfile);
// POST /profile/driver: 기사 프로필 생성
profileRouter.post("/driver", authMiddleware, profile_controller_1.default.createDriverProfile);
// PATCH /profile/driver: 기사 프로필 수정
profileRouter.patch("/driver", authMiddleware, profile_controller_1.default.updateDriverProfile);
// GET /profile/driver/:id: 기사 프로필 상세 조회
profileRouter.get("/driver/:id", authMiddleware, profile_controller_1.default.getDriverProfile);
exports.default = profileRouter;
//# sourceMappingURL=profile.router.js.map