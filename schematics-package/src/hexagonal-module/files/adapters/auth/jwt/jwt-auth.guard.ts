import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Authentication Guard for <%= classify(moduleName) %> Module
 *
 * This guard protects routes by validating JWT tokens.
 * It extends the Passport JWT strategy.
 *
 * Usage:
 * - Applied at controller level in <%= classify(moduleName) %>Controller
 * - Can be overridden at method level with @Public() decorator
 *
 * @see <%= classify(moduleName) %>Controller
 */
@Injectable()
export class <%= classify(moduleName) %>JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Add custom authentication logic here if needed
    return super.canActivate(context);
  }
}
