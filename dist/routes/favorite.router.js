"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const favorite_controller_1 = __importDefault(require("../controllers/favorite.controller"));
const favoriteRouter = express_1.default.Router();
favoriteRouter.get("/", favorite_controller_1.default.getAllFavoriteDrivers);
favoriteRouter.post("/drivers/:id", favorite_controller_1.default.createFavorite);
favoriteRouter.delete("/drivers/:id", favorite_controller_1.default.deleteFavorite);
exports.default = favoriteRouter;
//# sourceMappingURL=favorite.router.js.map