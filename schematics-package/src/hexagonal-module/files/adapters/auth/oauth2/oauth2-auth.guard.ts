import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * OAuth2 Authentication Guard for <%= classify(moduleName) %> Module
 *
 * This guard protects routes by validating OAuth2 access tokens.
 * It extends the Passport OAuth2 strategy.
 *
 * Supports:
 * - Authorization Code Flow
 * - Client Credentials Flow
 * - Token introspection
 *
 * Usage:
 * - Applied at controller level in <%= classify(moduleName) %>Controller
 * - Can be overridden at method level with @Public() decorator
 *
 * @see <%= classify(moduleName) %>Controller
 */
@Injectable()
export class <%= classify(moduleName) %>OAuth2Guard extends AuthGuard('oauth2') {
  canActivate(context: ExecutionContext) {
    // Add custom authentication logic here if needed
    // For example: token introspection, scope validation
    return super.canActivate(context);
  }
}
