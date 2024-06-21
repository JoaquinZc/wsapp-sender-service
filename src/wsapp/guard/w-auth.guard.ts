import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';

@Injectable()
export class WAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest() as Request;

    if(!("x-auth" in request.headers)) {
      return false;
    }

    const auth = request.headers['x-auth'];

    if(auth !== "hola123xD") {
      return false;
    }

    return true;
  }
}