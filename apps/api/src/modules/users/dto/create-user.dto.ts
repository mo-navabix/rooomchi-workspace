import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  MinLength,
  Length,
} from 'class-validator';
import { RoleEnum } from '../../../common/enums/role.enum';
import { UserStatus } from '../../../common/enums/user-status.enum';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Employee number is required' })
  @IsString()
  @Length(1, 50, { message: 'Employee number must be between 1 and 50 characters' })
  employeeNumber!: string;

  @IsNotEmpty({ message: 'First name is required' })
  @IsString()
  @Length(2, 100, { message: 'First name must be between 2 and 100 characters' })
  firstName!: string;

  @IsNotEmpty({ message: 'Last name is required' })
  @IsString()
  @Length(2, 100, { message: 'Last name must be between 2 and 100 characters' })
  lastName!: string;

  @IsNotEmpty({ message: 'Email address is required' })
  @IsEmail({}, { message: 'Please provide a valid corporate email address' })
  email!: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password?: string;

  @IsOptional()
  @IsEnum(RoleEnum, {
    message:
      'Role must be one of: SUPER_ADMIN, ORGANIZATION_ADMIN, MANAGER, SUPERVISOR, EMPLOYEE',
  })
  role?: RoleEnum;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
