"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const driver_controller_1 = __importDefault(require("../controllers/driver.controller"));
const driverRouter = express_1.default.Router();
driverRouter.get("/", driver_controller_1.default.getAllDrivers);
driverRouter.get("/:id", driver_controller_1.default.getDriverById);
driverRouter.patch("/:id", driver_controller_1.default.updateDriver);
exports.default = driverRouter;
//# sourceMappingURL=driver.router.js.map