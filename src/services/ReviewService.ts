import { findAllCompleted } from '../repositories/ReviewRepository';

export async function getAllCompleted() {
  return await findAllCompleted();
}
