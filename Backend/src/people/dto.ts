import { IsBoolean, IsHexColor, IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePersonDto {
  @IsString() @MinLength(2) name!: string;
  @IsHexColor() colorHex!: string;
}
export class UpdatePersonDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsHexColor() colorHex?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
