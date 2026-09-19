import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from '../../config/jwt.config';

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return null;
    return data ? user[data] : user;
  },
);
