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
  Inject,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../config/jwt.config';

@Controller('auth')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AuthController {
  constructor(
    @Inject(AuthService)
    private readonly authService: AuthService,
  ) {}

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
   * Registers a user into the selected organization (first user = org admin).
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
}
