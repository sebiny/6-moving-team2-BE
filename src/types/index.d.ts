import { AuthUser } from "@prisma/client"; // Prisma 모델을 가져옵니다.

declare global {
  namespace Express {
    interface User {
      id: string;
      userType: UserType;
    }
  }
}

export {};
