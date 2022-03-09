import { IsEmail } from "class-validator";

export class UpdateUserDto {
  @IsEmail()
  readonly email: string
  
  readonly username: string
  readonly password: string
  readonly image: string
  readonly bio: string
}