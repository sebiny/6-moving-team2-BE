import { Response } from "express";
import eventHub from "./eventHub";

export const sseEmitters: { [userId: string]: Response } = {};

export function sendSseEvent(userId: string, data: any) {
  const emitter = sseEmitters[userId];
  if (emitter) {
    emitter.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}

eventHub.on("send_notification", (userId: string, data: any) => {
  // console.log(`[EventHub] Received event for user: ${userId}`);
  sendSseEvent(userId, data);
});
