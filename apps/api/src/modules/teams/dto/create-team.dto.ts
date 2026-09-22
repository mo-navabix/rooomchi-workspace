import { IsNotEmpty, IsOptional, IsString, MaxLength, IsArray } from 'class-validator';

export class CreateTeamDto {
  @IsNotEmpty({ message: 'نام تیم الزامی است' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberIds?: string[];

  @IsOptional()
  @IsString()
  organizationId?: string;
}
