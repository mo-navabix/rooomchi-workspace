import { IsString, IsOptional, IsEnum, Length, Matches } from 'class-validator';
import { OrganizationStatus } from '../../../common/enums/organization-status.enum';

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  @Length(2, 255)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase alphanumeric characters and hyphens',
  })
  @Length(2, 100)
  slug?: string;

  @IsOptional()
  @IsString()
  @Length(3, 255)
  domain?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsEnum(OrganizationStatus)
  status?: OrganizationStatus;
}
