import prisma from '../config/prisma';
import type { Review, EstimateRequest, Prisma } from '@prisma/client';

export async function findAllCompleted() {
  return await prisma.estimateRequest.findMany({
    where: {
      status: 'COMPLETED'
    },
    select: {
      id: true,
      moveType: true,
      moveDate: true,
      fromAddress: true,
      toAddress: true,
      estimates: {
        where: {
          status: 'ACCEPTED'
        },
        select: {
          price: true,
          driver: {
            select: {
              profileImage: true,
              shortIntro: true
            }
          }
        }
      }
    }
  });
  // EstimateRequest의 status가 COMLPETED면은 가져오기
  //moveType, fromAddressId, toAddressId, moveDate
  //estimates의 price, driver의 profileImage, shortIntro
}
