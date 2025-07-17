"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const review_service_1 = __importDefault(require("../services/review.service"));
const asyncHandler_1 = require("../utils/asyncHandler");
const customError_1 = require("../utils/customError");
//작성 가능한 견적(리뷰)
const getAllCompletedEstimate = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const customerId = req.query.customerId;
    if (!customerId) {
        throw new customError_1.CustomError(400, "고객 아이디를 찾을 수 없습니다.");
    }
    const estimates = yield review_service_1.default.getAllCompleted(customerId);
    if (!estimates || estimates.length === 0) {
        throw new customError_1.CustomError(401, "작성 가능한 리뷰가 없습니다.");
    }
    res.status(200).json(estimates);
}));
//리뷰 작성하기
const createReview = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { customerId, content, rating, driverId, estimateRequestId } = req.body;
    if (!customerId || !content || !rating || !driverId || !estimateRequestId) {
        throw new customError_1.CustomError(400, "리뷰에 필요한 정보가 누락되었습니다.");
    }
    const review = yield review_service_1.default.createReview({
        customerId,
        content,
        rating,
        driverId,
        estimateRequestId
    });
    res.status(201).json(review);
}));
//내가 쓴 리뷰 가져오기
const getMyReviews = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const customerId = req.query.customerId;
    if (!customerId) {
        throw new customError_1.CustomError(400, "고객 아이디를 찾을 수 없습니다.");
    }
    const reviews = yield review_service_1.default.getMyReviews(customerId);
    if (!reviews || reviews.length === 0) {
        throw new customError_1.CustomError(401, "내가 쓴 리뷰가 없습니다.");
    }
    res.status(201).json(reviews);
}));
exports.default = {
    getAllCompletedEstimate,
    createReview,
    getMyReviews
};
//# sourceMappingURL=review.controller.js.map