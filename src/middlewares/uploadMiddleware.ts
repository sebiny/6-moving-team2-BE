import path from "path";
import { S3Client } from "@aws-sdk/client-s3";
import multerS3 from "multer-s3";
import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import { CustomError } from "../utils/customError";

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_BUCKET_NAME } = process.env;

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION || !AWS_BUCKET_NAME) {
  throw new Error(
    "AWS S3 환경 변수가 설정되지 않았습니다. .env 파일을 확인해주세요. (필수: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_BUCKET_NAME)"
  );
}

const s3 = new S3Client({
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  },
  region: AWS_REGION
});

// CloudFront URL 생성 (없으면 undefined)
export const getCloudFrontUrl = (s3Key: string) => {
  const domain = process.env.CLOUDFRONT_DOMAIN;
  if (!domain) return undefined;
  return `https://${domain}/${s3Key}`;
};

const storage = multerS3({
  s3: s3,
  bucket: AWS_BUCKET_NAME,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req: Request, file: Express.Multer.File, cb: (error: any, key?: string) => void) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `public/images/${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new CustomError(400, "지원하지 않는 파일 형식입니다. (jpeg, png, gif만 허용됩니다.)");
    cb(error);
  }
};

const uploadMiddleware = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

export default uploadMiddleware;
