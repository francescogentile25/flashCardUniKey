import { UserResponse } from "../models/responses/user.response";
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from "@ngrx/signals";
import { computed, inject } from "@angular/core";
import { AuthService } from "../services/auth.service";
import { Router } from "@angular/router";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { filter, interval, map, of, pipe, switchMap, tap } from "rxjs";
import { tapResponse } from "@ngrx/operators";
import { LoginRequest } from "../models/requests/login.request";
import {MessageService} from 'primeng/api';
import {SpinLoaderService} from '../../../core/services/spin-loader.service';
import { extractErrorMessage } from "../../../core/utils/extract-error-message.util";
import { loginSuccessPage, logoutSuccessPage } from "./config/auth.config";
import { LoginResponse } from "../models/responses/login.response";

const POLLING_INTERVAL_MS = 15 * 60 * 1000;

type AuthState = {
  user: UserResponse | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | undefined;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: undefined,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed(({ user }) => ({
    userName: computed(() => {
      const u = user();
      return u ? `${u.nome} ${u.cognome}` : 'Guest';
    }),
    email: computed(() => user()?.email ?? null),
    matricola: computed(() => user()?.matricola ?? null),
    isAdmin: computed(() => {
      const u = user();
      if (!u) return false;
      return u.ruoli?.includes('Admin') ?? false;
    }),
    // TODO: DA DEFINIRE IN BASE AI RUOLI DEL PROGETTO
    maxRole: computed(() => {
    })
  })),

  withMethods((store, authService = inject(AuthService), router = inject(Router), messageService = inject(MessageService), loaderService = inject(SpinLoaderService)) => ({

    // Imposta un errore nello stato e blocca il loading
    setError(error: string | undefined) {
      patchState(store, { error, loading: false });
    },

    // Rimuove l’errore attuale
    clearError() {
      patchState(store, { error: undefined });
    },

    // Salva l’utente nello stato e segna l’autenticazione come attiva
    setUser(user: UserResponse) {
      patchState(store, {
        user,
        isAuthenticated: true,
        loading: false,
        error: undefined
      });
    },

    // Svuota completamente lo stato riportandolo a quello iniziale
    clearUser() {
      patchState(store, initialState);
    },

    // Effettua la chiamata GET /me per recuperare i dati utente attuali
    // Attiva il loader, aggiorna lo stato, e gestisce errori senza lasciare loader acceso
    me$: rxMethod<void>(
      pipe(
        tap(() => {
          // Prima della chiamata: segno loading e apro il loader grafico
          patchState(store, { loading: true, error: undefined });
          loaderService.startSpinLoader();
        }),
        switchMap(() =>
          authService.me().pipe(
            tapResponse({
              // Se la chiamata ha successo aggiorno user e chiudo il loader
              next: (user) => {
                patchState(store, {
                  user,
                  isAuthenticated: true,
                  loading: false,
                  error: undefined
                });
                loaderService.stopSpinLoader();
              },
              // Se fallisce, segno che non è autenticato e chiudo il loader comunque
              error: (error: Error) => {
                patchState(store, {
                  user: null,
                  isAuthenticated: false,
                  loading: false,
                  error: error.message
                });
                loaderService.stopSpinLoader();
              },
            })
          )
        )
      )
    ),

    // Effettua il login con email + password
    login$: rxMethod<LoginRequest>(
      pipe(
        tap(() => {
          // Prima della chiamata: segno loading e mostro loader
          patchState(store, { loading: true, error: undefined });
          loaderService.startSpinLoader();
        }),
        switchMap((credentials) =>
          authService.login(credentials).pipe(
            // Se il login è ok → chiama /me, altrimenti fermati
            switchMap((loginRes: LoginResponse) => {
              if (!loginRes.success) {
                // caso login fallito: non chiamiamo /me
                return of({ type: 'login-failed', loginRes } as const);
              }

              // caso login ok: facciamo subito /me
              return authService.me().pipe(
                map((user) => ({ type: 'login-success', user } as const))
              );
            }),
            tapResponse({
              next: (result) => {
                if (result.type === 'login-failed') {
                  const loginRes = result.loginRes;

                  messageService.add({
                    severity: 'error',
                    summary: `[Auth Store] Login Error`,
                    detail: loginRes.message || 'Credenziali non valide'
                  });

                  patchState(store, {
                    loading: false,
                    isAuthenticated: false,
                    error: loginRes.message || 'Credenziali non valide'
                  });

                  loaderService.stopSpinLoader();
                  return;
                }

                // kind === 'login-success'
                const user = result.user;

                patchState(store, {
                  user,
                  isAuthenticated: true,
                  loading: false,
                  error: undefined
                });

                router.navigateByUrl(loginSuccessPage);
                loaderService.stopSpinLoader();
              },
              error: (error: Error) => {
                // Errore di rete / server sul login o sulla me
                messageService.add({
                  severity: 'error',
                  summary: `[Auth Store] Login Error`,
                  detail: extractErrorMessage(error)
                });

                patchState(store, {
                  loading: false,
                  isAuthenticated: false,
                  error: 'Errore durante il login'
                });

                loaderService.stopSpinLoader();
              },
            })
          )
        )
      )
    ),

    // Effettua il logout: chiama API, resetta stato e va alla pagina di logout
    logout$: rxMethod<void>(
      pipe(
        tap(() =>
          // Prima della chiamata: indico loading
          patchState(store, { loading: true })
        ),
        switchMap(() =>
          authService.logout().pipe(
            tapResponse({
              // Logout corretto: reset e redirect
              next: () => {
                patchState(store, initialState);
                router.navigateByUrl(logoutSuccessPage);
              },
              // Logout fallito: mostro solo toast, non resetto nulla
              error: (error: Error) => {
                messageService.add({
                  severity: 'error',
                  summary: `[Auth Store] Logout Error`,
                  detail: extractErrorMessage(error)
                });
              },
            })
          )
        )
      )
    ),

    // Avvia un polling periodico di /me per mantenere aggiornati i dati utente
    // Non mostra errori a video, solo logga e resetta stato se la sessione scade
    startUserPolling$: rxMethod<void>(
      pipe(
        switchMap(() =>
          // Ogni intervallo temporale
          interval(POLLING_INTERVAL_MS).pipe(
            // Il polling si attiva solo se l'utente risulta autenticato nello stato
            filter(() => store.isAuthenticated()),
            // Richiama /me per vedere se la sessione è ancora valida
            switchMap(() =>
              authService.me().pipe(
                tapResponse({
                  // Se va bene aggiorna lo stato e continua come nulla fosse
                  next: (user) => {
                    patchState(store, {
                      user,
                      isAuthenticated: true,
                      loading: false,
                      error: undefined
                    });
                  },
                  // Se fallisce probabilmente la sessione è scaduta: reset silenzioso
                  error: (error: Error) => {
                    console.warn('[Auth Store] Polling error:', error);
                    patchState(store, {
                      user: null,
                      isAuthenticated: false,
                      loading: false,
                      error: error.message
                    });
                  },
                })
              )
            )
          )
        )
      )
    ),
  })),
  withHooks({
    onInit(store) {
      store.me$();
      store.startUserPolling$();
    },
  })
);
