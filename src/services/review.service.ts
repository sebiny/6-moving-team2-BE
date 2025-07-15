import { findAllCompleted } from "../repositories/review.repository";

export async function getAllCompleted() {
  return await findAllCompleted();
}
