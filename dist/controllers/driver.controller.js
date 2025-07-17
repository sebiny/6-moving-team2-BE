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
const driver_service_1 = __importDefault(require("../services/driver.service"));
const asyncHandler_1 = require("../utils/asyncHandler");
const getAllDrivers = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { keyword, orderBy, region, service, page } = req.query;
    const options = {
        keyword: keyword,
        orderBy: orderBy, //| "rating";,
        region: region,
        service: service,
        page: Number(page)
    };
    const result = yield driver_service_1.default.getAllDrivers(options);
    res.status(200).json(result);
}));
const getDriverById = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield driver_service_1.default.getDriverById(id);
    res.status(200).json(result);
}));
const updateDriver = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const data = req.body;
    const result = yield driver_service_1.default.updateDriver(id, data);
    res.status(200).json(result);
}));
exports.default = {
    getAllDrivers,
    getDriverById,
    updateDriver
};
//# sourceMappingURL=driver.controller.js.map