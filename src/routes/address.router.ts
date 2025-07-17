import express from "express";
import addressController from "../controllers/address.controller";

const router = express.Router();

router.post("/", addressController.createAddress);

export default router;
