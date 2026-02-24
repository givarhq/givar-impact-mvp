import {
    CallHandler,
    ExecutionContext,
    HttpException,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as Sentry from '@sentry/node';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            catchError((error) => {
                // Logic: Skip expected client HTTP exceptions (400, 401, 403, 404) to prevent alert fatigue.
                // We only want Sentry to catch true 500+ unhandled backend panics.
                if (error instanceof HttpException) {
                    const status = error.getStatus();
                    if (status < 500) {
                        return throwError(() => error);
                    }
                }

                const http = context.switchToHttp();
                const request = http.getRequest();

                // Logic: Capture unhandled server exceptions with forensic trace context
                Sentry.captureException(error, {
                    extra: {
                        path: request.url,
                        method: request.method,
                        body: request.body,
                        query: request.query,
                        ip: request.ip || request.headers['x-forwarded-for'],
                    },
                });

                return throwError(() => error);
            }),
        );
    }
}