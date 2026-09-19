import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateOrgAdminDto {
  @IsNotEmpty({ message: 'First name is required' })
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @IsNotEmpty({ message: 'Last name is required' })
  @IsString()
  @MaxLength(100)
  lastName!: string;

  @IsNotEmpty({ message: 'Email address is required' })
  @IsEmail({}, { message: 'A valid email address is required' })
  email!: string;

  @IsNotEmpty({ message: 'Initial admin password is required' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  employeeNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  jobTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;
}
