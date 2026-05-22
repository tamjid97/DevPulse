export interface IUserAuth {
  name: string;
  email: string;
  password: string;
  role?: "contributor" | "maintainer";
}