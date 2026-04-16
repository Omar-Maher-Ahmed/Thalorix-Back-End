import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    // If the token is in the 'token' cookie, move it to 'Authorization' header
    if (request.cookies && request.cookies.token) {
      request.headers.authorization = `Bearer ${request.cookies.token}`;
    }
    return request;
  }
}
