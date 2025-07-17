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
const review_repository_1 = __importDefault(require("../repositories/review.repository"));
//작성 가능한 견적(리뷰)
function getAllCompleted(customerId) {
    return __awaiter(this, void 0, void 0, function* () {
        return review_repository_1.default.findAllCompletedEstimateRequest(customerId);
    });
}
//리뷰 작성
function createReview(data) {
    return __awaiter(this, void 0, void 0, function* () {
        return review_repository_1.default.createReview(data);
    });
}
//내가 쓴 리뷰
function getMyReviews(customerId) {
    return __awaiter(this, void 0, void 0, function* () {
        return review_repository_1.default.getMyReviews(customerId);
    });
}
exports.default = { getAllCompleted, createReview, getMyReviews };
//# sourceMappingURL=review.service.js.map