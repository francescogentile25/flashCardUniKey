import { CanActivateFn, Router } from "@angular/router";
import { inject } from "@angular/core";
import { toObservable } from "@angular/core/rxjs-interop";
import { filter, map, take } from "rxjs";
import { AuthStore } from "../../features/auth/store/auth.store";
import { MessageService } from "primeng/api";
import { globalPaths } from "../../features/_config/global-paths.config";

export const adminGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const messageService = inject(MessageService);

  // Converto signal in observable e aspetta che il loading sia completato
  return toObservable(authStore.loading).pipe(
    filter(loading => !loading), // Aspetto che loading sia false
    take(1), // Prendo solo il primo valore
    map(() => {
      if (!authStore.isAuthenticated()) {
        messageService.add({
          severity: 'warn',
          summary: `[Admin Guard]`,
          detail: 'Utente non trovato'
        });
        return router.createUrlTree([globalPaths.loginUrl], {
          queryParams: { returnUrl: state.url }
        });
      }

      if (!authStore.isAdmin()) {
        messageService.add({
          severity: 'warn',
          summary: `[Admin Guard]`,
          detail: 'Non sei Amministratore'
        });
        return router.createUrlTree([globalPaths.homeUrl]);
      }

      return true;
    })
  );
};
