import express from "express";
import favoriteController from "../controllers/favorite.controller";
import passport from "../config/passport";

const favoriteRouter = express.Router();
const authMiddleware = passport.authenticate("access-token", { session: false, failWithError: true });

favoriteRouter.get("/", authMiddleware, favoriteController.getAllFavoriteDrivers);

favoriteRouter.post("/drivers/:id", authMiddleware, favoriteController.createFavorite);

favoriteRouter.delete("/drivers/:id", authMiddleware, favoriteController.deleteFavorite);

export default favoriteRouter;
