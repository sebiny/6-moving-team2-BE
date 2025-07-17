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
const estimateReq_service_1 = __importDefault(require("../services/estimateReq.service"));
const asyncHandler_1 = require("../utils/asyncHandler");
const customError_1 = require("../utils/customError");
// 주소 등록
const createAddress = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { postalCode, street, detail, region, district } = req.body;
    if (!postalCode || !street || !region || !district) {
        throw new customError_1.CustomError(400, "필수 주소 정보가 누락되었습니다.");
    }
    const address = yield estimateReq_service_1.default.createAddress({
        postalCode,
        street,
        detail,
        region,
        district
    });
    res.status(201).json(address);
}));
// 고객 주소 연결
const linkCustomerAddress = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { customerId, addressId, role } = req.body;
    if (!customerId || !addressId || !role) {
        throw new customError_1.CustomError(400, "필수 주소 정보가 누락되었습니다.");
    }
    const link = yield estimateReq_service_1.default.linkCustomerAddress({ customerId, addressId, role });
    res.status(201).json(link);
}));
// 고객 주소 목록 조회
const getCustomerAddressesByRole = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { role, customerId } = req.query;
    if (!customerId || typeof role !== "string") {
        throw new customError_1.CustomError(400, "필수 요청 정보가 누락되었습니다.");
    }
    const addresses = yield estimateReq_service_1.default.getCustomerAddressesByRole(customerId, role);
    res.status(200).json(addresses);
}));
// 견적 요청 생성
const createEstimateRequest = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { customerId, moveType, moveDate, fromAddressId, toAddressId } = req.body;
    if (!customerId || !moveType || !moveDate || !fromAddressId || !toAddressId) {
        throw new customError_1.CustomError(400, "필수 요청 정보가 누락되었습니다.");
    }
    if (fromAddressId === toAddressId) {
        throw new customError_1.CustomError(400, "출발지와 도착지는 서로 달라야 합니다.");
    }
    const request = yield estimateReq_service_1.default.createEstimateRequest({
        customerId,
        moveType,
        moveDate: new Date(moveDate),
        fromAddressId,
        toAddressId,
        status: "PENDING"
    });
    res.status(201).json(request);
}));
exports.default = {
    createAddress,
    linkCustomerAddress,
    getCustomerAddressesByRole,
    createEstimateRequest
};
//# sourceMappingURL=estimateReq.controller.js.map