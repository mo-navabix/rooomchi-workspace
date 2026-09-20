import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  Length,
} from 'class-validator';

/** Body from AuthModal register (legacy Express shape). */
export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 200)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsNotEmpty()
  @IsUUID()
  orgId!: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  role?: string;
}
