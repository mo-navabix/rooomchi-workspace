import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class AddTeamMembersDto {
  @IsNotEmpty({ message: 'حداقل یک کاربر برای افزودن به تیم الزامی است' })
  @IsArray()
  @IsString({ each: true })
  userIds!: string[];
}
