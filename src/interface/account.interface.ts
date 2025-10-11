export interface UserProps {
  name: {
    firstName: string;
    lastName: string;
  };
  email: string;
  mobile: string;
  password: string;
  verified: boolean;
  online: boolean;
  block: boolean;
  role: "admin" | "user";
  canWriteBlog?: boolean;
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateUserProps {
  name?: {
    firstName: string;
    lastName: string;
  };
  email?: string;
  mobile?: string;
  password?: string;
  verified?: boolean;
  online?: boolean;
  block?: boolean;
  role?: "admin" | "user";
  canWriteBlog?: boolean;
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
}
