import { CanActivateFn, Router } from "@angular/router";
import { inject } from "@angular/core";
import { toObservable } from "@angular/core/rxjs-interop";
import { filter, map, take } from "rxjs";
import { AuthStore } from "../../features/auth/store/auth.store";
import { MessageService } from "primeng/api";
import { globalPaths } from "../../features/_config/global-paths.config";

export const authGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const messageService = inject(MessageService);

  return toObservable(authStore.loading).pipe(
    filter(loading => !loading),
    take(1),
    map(() => {
      if (!authStore.isAuthenticated()) {
        messageService.add({
          severity: 'warn',
          summary: `[Auth Guard]`,
          detail: 'Utente non trovato'
        });
        return router.createUrlTree([globalPaths.loginUrl], {
          queryParams: { returnUrl: state.url }
        });
      }
      return true;
    })
  );
};
