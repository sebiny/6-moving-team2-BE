"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const customError_1 = require("../utils/customError");
function errorHandler(err, req, res, next) {
    console.error(err);
    if (err instanceof customError_1.CustomError) {
        return res.status(err.statusCode).json({ message: err.message });
    }
    res.status(500).json({ message: "서버 내부 오류가 발생했습니다." });
}
//# sourceMappingURL=errorHandler.js.map