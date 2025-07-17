"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const port = (_a = process.env.PORT) !== null && _a !== void 0 ? _a : 4000;
app_1.default.listen(port, () => {
    console.log(`Server is running on port! ${port}`);
});
//# sourceMappingURL=server.js.map