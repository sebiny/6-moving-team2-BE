import 'dotenv/config';
import app from './app';
import { startEstimateCompletionScheduler } from './utils/estimateCompletionScheduler';

const port = process.env.PORT ?? 4000;

app.listen(port, () => {
  console.log(`Server is running on port! ${port}`);
  
  // 견적 완료 스케줄러 시작
  startEstimateCompletionScheduler();
});
