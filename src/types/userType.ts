export const UserType = {
  CUSTOMER: 'CUSTOMER',
  DRIVER: 'DRIVER'
} as const;

export type UserType = (typeof UserType)[keyof typeof UserType];
