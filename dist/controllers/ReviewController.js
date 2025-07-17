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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCompletedController = void 0;
const ReviewService_1 = require("../services/ReviewService");
const getAllCompletedController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield (0, ReviewService_1.getAllCompleted)();
        return res.status(200).json({ success: true, data });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: '서버요청오류' });
    }
});
exports.getAllCompletedController = getAllCompletedController;
//# sourceMappingURL=ReviewController.js.map