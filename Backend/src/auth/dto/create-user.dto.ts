// backend/src/auth/dto/create-user.dto.ts
import { IsEmail, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @MinLength(8)
  password!: string;
}
