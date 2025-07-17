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
const prisma_1 = __importDefault(require("../config/prisma"));
//작성가능한 견적(리뷰)
function findAllCompletedEstimateRequest(customerId) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.default.estimateRequest.findMany({
            where: {
                status: "PENDING"
                //COMPLETED임
            },
            select: {
                id: true,
                moveType: true,
                moveDate: true,
                fromAddress: {
                    select: {
                        region: true,
                        district: true
                    }
                },
                toAddress: {
                    select: {
                        region: true,
                        district: true
                    }
                },
                estimates: {
                    where: {
                        status: "ACCEPTED"
                    },
                    select: {
                        price: true,
                        driver: {
                            select: {
                                profileImage: true,
                                shortIntro: true
                            }
                        }
                    }
                }
            }
        });
    });
}
//리뷰 작성하기
function createReview(data) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.default.review.create({ data });
    });
}
//내가 쓴 리뷰 가져오기
function getMyReviews(customerId) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.default.review.findMany({
            select: {
                rating: true,
                content: true,
                driver: {
                    select: {
                        nickname: true,
                        profileImage: true,
                        shortIntro: true
                    }
                },
                request: {
                    select: {
                        moveDate: true,
                        fromAddress: {
                            select: {
                                region: true,
                                district: true
                            }
                        },
                        toAddress: {
                            select: {
                                region: true,
                                district: true
                            }
                        }
                    }
                }
            }
        });
    });
}
exports.default = {
    findAllCompletedEstimateRequest,
    createReview,
    getMyReviews
};
// EstimateRequest의 status가 COMLPETED면은 가져오기
//estimates의 price, driver의 profileImage, shortIntro
//# sourceMappingURL=review.repository.js.map