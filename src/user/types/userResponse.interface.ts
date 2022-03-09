import { UserType } from "@app/user/types/user.type";

export interface UserResponseInterfase {
  user: UserType & { token: string }
}