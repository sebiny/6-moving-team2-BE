export const getCookieDomain = (): string | undefined => {
  const clientUrl = process.env.CLIENT_URL ?? "";

  // 로컬 개발 환경이면 domain 생략
  if (clientUrl.includes("localhost")) {
    return undefined;
  }

  // 배포 환경이면 .도메인 형식
  return "www.moving-2.click";
};
