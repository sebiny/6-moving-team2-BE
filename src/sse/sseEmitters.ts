import { Response } from "express";

export const sseEmitters: { [userId: string]: Response } = {};
