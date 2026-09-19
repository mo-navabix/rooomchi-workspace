import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  Length,
} from 'class-validator';
import { RoleEnum } from '../../../common/enums/role.enum';

export class InviteUserDto {
  @IsNotEmpty({ message: 'Email address is required' })
  @IsEmail({}, { message: 'Please provide a valid corporate email address' })
  email!: string;

  @IsNotEmpty({ message: 'First name is required' })
  @IsString()
  @Length(2, 100)
  firstName!: string;

  @IsNotEmpty({ message: 'Last name is required' })
  @IsString()
  @Length(2, 100)
  lastName!: string;

  @IsNotEmpty({ message: 'Employee number is required' })
  @IsString()
  @Length(1, 50)
  employeeNumber!: string;

  @IsOptional()
  @IsEnum(RoleEnum)
  role?: RoleEnum;
}
