export {};

declare global {
  namespace Express {
    namespace Multer {
      interface File {
        location?: string;
        key?: string;
        bucket?: string;
        etag?: string;
      }
    }
  }
}
