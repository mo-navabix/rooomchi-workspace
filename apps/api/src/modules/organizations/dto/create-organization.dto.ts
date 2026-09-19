import { IsNotEmpty, IsString, IsOptional, IsEnum, Matches, Length } from 'class-validator';
import { OrganizationStatus } from '../../../common/enums/organization-status.enum';

export class CreateOrganizationDto {
  @IsNotEmpty({ message: 'Organization name is required' })
  @IsString()
  @Length(2, 255, { message: 'Organization name must be between 2 and 255 characters' })
  name!: string;

  @IsNotEmpty({ message: 'Organization slug is required' })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase alphanumeric characters and hyphens (e.g. technova or company-a)',
  })
  @Length(2, 100, { message: 'Organization slug must be between 2 and 100 characters' })
  slug!: string;

  @IsOptional()
  @IsString()
  code?: string;

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
