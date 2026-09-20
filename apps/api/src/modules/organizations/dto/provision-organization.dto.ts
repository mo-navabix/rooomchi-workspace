import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrganizationStatus } from '../../../common/enums/organization-status.enum';

class WorkHoursDto {
  @IsOptional()
  @IsString()
  start?: string;

  @IsOptional()
  @IsString()
  end?: string;
}

class OrgSettingsDto {
  @IsOptional()
  @IsBoolean()
  autoApprove?: boolean;

  @IsOptional()
  @IsNumber()
  maxBookingHours?: number;

  @IsOptional()
  @IsBoolean()
  allowWeekend?: boolean;
}

/** Body from OrgProvisioningModal / legacy Express POST /api/organizations */
export class ProvisionOrganizationDto {
  @IsNotEmpty({ message: 'Organization name is required' })
  @IsString()
  @Length(2, 255)
  name!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  @Length(2, 100)
  slug?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsIn(['starter', 'business', 'enterprise'])
  plan?: 'starter' | 'business' | 'enterprise';

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  buildings?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  departments?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => WorkHoursDto)
  workHours?: WorkHoursDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => OrgSettingsDto)
  settings?: OrgSettingsDto;

  @IsOptional()
  @IsArray()
  initialRooms?: Record<string, unknown>[];

  @IsOptional()
  @IsEnum(OrganizationStatus)
  status?: OrganizationStatus;
}
