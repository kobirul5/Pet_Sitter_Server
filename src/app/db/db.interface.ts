export interface IAdmin {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role;
}

export enum Role {
  ADMIN,
  SITTER,
  USER,
  SUPER_ADMIN,
}
