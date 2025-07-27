//리뷰 타입
export type CreateReviewInput = {
  customerId: string;
  rating: number;
  content: string;
  driverId: string; // 대상 기사님
  estimateRequestId: string; // 연결된 견적 요청
};
export type ReviewInput = {
  customerId: string;
  rating: number;
  content: string;
  driverId: string; // 대상 기사님
  estimateRequestId: string; // 연결된 견적 요청
};
