import {
  Controller,
  Post,
  Body,
  UseGuards,
  ValidationPipe,
  UsePipes,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../config/jwt.config';

@Controller('auth')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/login
   * Automatically isolates organization from request hostname (subdomain).
   *
   * Example:
   * Request: Host: technova.didarhub.ir
   * Backend extracts organizationSlug = technova
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    return this.authService.login(loginDto, req.tenantContext);
  }

  /**
   * POST /auth/change-password
   * Authenticated endpoint for changing initial/temporary password.
   */
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() currentUser: JwtPayload,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(currentUser.userId, changePasswordDto);
  }

  /**
   * POST /auth/register
   * Requirement: Public registration is strictly disabled.
   * "The system is not a public registration platform.
   *  Companies purchase the system and an organization administrator manages employees."
   */
  @Public()
  @Post('register')
  async register() {
    throw new ForbiddenException({
      statusCode: HttpStatus.FORBIDDEN,
      error: 'Public Registration Disabled',
      message:
        'Didar is a multi-tenant B2B enterprise platform. Public self-registration is disabled. Employees can only be created or invited by their Organization Administrator via POST /organizations/:id/users.',
    });
  }
}
