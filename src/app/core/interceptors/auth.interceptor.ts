import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, throwError } from "rxjs";
import { AuthStore } from "../../features/auth/store/auth.store";
import { globalPaths } from "../../features/_config/global-paths.config";
import { MessageService } from "primeng/api";

const AUTH_ENDPOINTS = [
  '/api/login',
  '/api/logout',
  '/api/me'
];

function isAuthEndpoint(url: string): boolean {
  return AUTH_ENDPOINTS.some(endpoint => url.includes(endpoint));
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (isAuthEndpoint(req.url)) {
    return next(req);
  }

  const authStore = inject(AuthStore);
  const router = inject(Router);
  const messageService = inject(MessageService);

  return next(req).pipe(
    catchError((error) => {
      // 401 Unauthorized - token expired o non valido
      if (error.status === 401) {
        authStore.clearUser();
        messageService.add({
          severity: 'warn',
          summary: 'Sessione scaduta',
          detail: 'La tua sessione è scaduta. Effettua nuovamente l\'accesso.'
        });
        router.navigateByUrl(globalPaths.loginUrl);
      }

      // 403 Forbidden - no permissions
      if (error.status === 403) {
        messageService.add({
          severity: 'error',
          summary: 'Accesso negato',
          detail: 'Non hai i permessi per accedere a questa risorsa.'
        });
        router.navigateByUrl(globalPaths.homeUrl);
      }

      return throwError(() => error);
    })
  );
};
