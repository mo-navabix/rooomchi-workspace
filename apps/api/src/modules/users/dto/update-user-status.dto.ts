import { IsNotEmpty, IsEnum } from 'class-validator';
import { UserStatus } from '../../../common/enums/user-status.enum';

export class UpdateUserStatusDto {
  @IsNotEmpty({ message: 'Status is required' })
  @IsEnum(UserStatus, {
    message: 'Status must be one of: ACTIVE, INACTIVE, INVITED, SUSPENDED',
  })
  status!: UserStatus;
}
