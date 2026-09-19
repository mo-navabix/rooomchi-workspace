import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEmail,
  ValidateIf,
} from 'class-validator';

export class LoginDto {
  /**
   * Option 1: Login via Corporate Email
   */
  @ValidateIf((o) => !o.employeeNumber)
  @IsNotEmpty({ message: 'Email is required when employee number is not provided' })
  @IsEmail({}, { message: 'Please provide a valid corporate email address' })
  email?: string;

  /**
   * Option 2: Login via Employee Number (Organization detected from subdomain)
   */
  @ValidateIf((o) => !o.email)
  @IsNotEmpty({ message: 'Employee number is required when email is not provided' })
  @IsString()
  employeeNumber?: string;

  /**
   * Password is required for all authentication methods
   */
  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  password!: string;

  /**
   * Optional manual organization slug (useful for API clients or environments without DNS subdomains)
   * In standard browser flows, this is automatically extracted from Host header.
   */
  @IsOptional()
  @IsString()
  organizationSlug?: string;
}
