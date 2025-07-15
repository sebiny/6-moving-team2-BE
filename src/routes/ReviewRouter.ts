// routes/review.routes.ts
import express from "express";
import { getAllCompletedController } from "../controllers/ReviewController";

const reviewRouter = express.Router();

reviewRouter.get("/completed", getAllCompletedController);

export default reviewRouter;
