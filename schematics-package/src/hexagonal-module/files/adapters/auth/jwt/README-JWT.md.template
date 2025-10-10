# JWT Authentication for <%= classify(moduleName) %> Module

This module uses JWT (JSON Web Token) authentication to secure endpoints.

## Configuration

### Environment Variables

```bash
# JWT Secret Key (use a strong, random value in production)
JWT_SECRET=your-secret-key-here

# JWT Expiration Time
JWT_EXPIRATION=1h

# JWT Issuer
JWT_ISSUER=<%= dasherize(moduleName) %>-service

# JWT Audience
JWT_AUDIENCE=<%= dasherize(moduleName) %>-api
```

## Usage

### Protected Endpoints

All endpoints in <%= classify(moduleName) %>Controller are protected by default with JWT authentication.

### Request Headers

Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Example Request

```bash
curl -X GET http://localhost:3000/<%= dasherize(moduleName) %>/123 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Token Structure

### Payload

```json
{
  "sub": "user-id",
  "username": "john.doe",
  "email": "john.doe@example.com",
  "roles": ["user", "admin"],
  "iat": 1516239022,
  "exp": 1516242622
}
```

### Claims

- **sub**: Subject (user ID)
- **username**: Username
- **email**: User email
- **roles**: User roles/permissions
- **iat**: Issued at timestamp
- **exp**: Expiration timestamp

## Public Endpoints

To make specific endpoints public (no authentication required), use the `@Public()` decorator:

```typescript
import { Public } from '@share/decorators/public.decorator';

@Public()
@Get('health')
async health() {
  return { status: 'ok' };
}
```

## Role-Based Access Control (RBAC)

Use the `@Roles()` decorator to restrict access based on user roles:

```typescript
import { Roles } from '@share/decorators/roles.decorator';

@Roles('admin')
@Delete(':id')
async delete(@Param('id') id: string) {
  // Only users with 'admin' role can access this
}
```

## Testing

### Generate Test Token

For development/testing, you can generate a test token:

```typescript
import { JwtService } from '@nestjs/jwt';

const jwtService = new JwtService({
  secret: 'your-secret-key-here',
});

const token = jwtService.sign({
  sub: 'test-user-id',
  username: 'testuser',
  email: 'test@example.com',
  roles: ['user'],
});

console.log(token);
```

### Postman/Insomnia

1. Set Authorization type to "Bearer Token"
2. Paste your JWT token
3. Send request

## Security Best Practices

1. **Secret Key**: Use a strong, random secret key (minimum 256 bits)
2. **HTTPS**: Always use HTTPS in production
3. **Token Expiration**: Set reasonable expiration times (1 hour recommended)
4. **Refresh Tokens**: Implement refresh token mechanism for better UX
5. **Token Revocation**: Implement token blacklist for logout functionality
6. **Rate Limiting**: Add rate limiting to prevent brute force attacks
7. **Validation**: Validate all token claims (issuer, audience, expiration)

## Troubleshooting

### 401 Unauthorized

- Check if token is included in Authorization header
- Verify token format: `Bearer <token>`
- Ensure token hasn't expired
- Validate JWT_SECRET matches between services

### 403 Forbidden

- User is authenticated but lacks required permissions
- Check user roles match @Roles() decorator requirements

## References

- [JWT.io](https://jwt.io/)
- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [Passport JWT Strategy](http://www.passportjs.org/packages/passport-jwt/)
