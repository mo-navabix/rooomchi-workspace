import { ExecutionContext } from '@nestjs/common';

/** Read route/class metadata without Reflector DI (works with APP_GUARD). */
export function getRouteMetadata<T>(
  key: string,
  context: ExecutionContext,
): T | undefined {
  const handlerValue = Reflect.getMetadata(key, context.getHandler());
  if (handlerValue !== undefined) {
    return handlerValue as T;
  }
  return Reflect.getMetadata(key, context.getClass()) as T | undefined;
}
