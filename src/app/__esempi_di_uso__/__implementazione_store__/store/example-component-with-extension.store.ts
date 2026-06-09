import { patchState, signalStore, withComputed, withMethods } from "@ngrx/signals";
import { createEntityStoreConfig } from "../../../core/store/base.store";
import { EntityResponse } from "../models/responses/entity.response";
import { ExampleComponentService } from "../services/example-component.service";
import { inject } from "@angular/core";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { distinctUntilChanged, EMPTY, pipe, switchMap, tap } from "rxjs";
import { tapResponse } from "@ngrx/operators";
import { setEntities } from "@ngrx/signals/entities";
import { extractErrorMessage } from "../../../core/utils/extract-error-message.util";
import { SpinLoaderService } from "../../../core/services/spin-loader.service";
import { MessageService } from "primeng/api";

export const ExampleComponentWithExtensionStore = signalStore(
  { providedIn: 'root' },
  ...createEntityStoreConfig<EntityResponse>({
    storeName: 'Entity Store',
    serviceToken: ExampleComponentService,
    useBackendPagination: false, // Opzione per abilitare la paginazione lato backend
    showSuccessMessages: true, // Opzione per disabilitare i messaggi di successo
    showErrorMessages: true // Opzione per disabilitare i messaggi di errore
  }),

  // ESEMPIO:   Estensione dei Computed dello store
  // store: Lo store base di tipo EntityResponse
  // ...args:   Si possono iniettare altri store o altri servizi (da cancellare)
  withComputed((store, ...args: unknown[]) => ({
    // ... computed custom che non esistono nello store base
  })),

  // ESEMPIO:   Estensione dei Metodi dello store
  // store:     Lo store base di tipo EntityResponse
  // service:   Da iniettare di nuovo il suo servizio perche non lo capisce da solo perchè stiamo estendeno solo i metodi
  // storeK:    Iniettato lo store dell'entità K
  // ...args:   Si possono iniettare altri store o altri servizi (da cancellare)
  withMethods((
    store,
    service = inject(ExampleComponentService),
    // storeK = inject(KStore),
    loaderService = inject(SpinLoaderService),
    messageService = inject(MessageService),
    ...args: unknown[]) => ({
    // customCallbackFn$: rxMethod<void>(     <-- Creo un nuovo metodo custom customCallbackFn$
    //   pipe(
    //     tap(() => {
    //       patchState(store, { loading: true, error: undefined });
    //       loaderService.startSpinLoader();
    //     }),
    //     switchMap(() => {
    //       if (!service.customCallbackFn) {     <-- Controllo se la funzione custom customCallbackFn esiste
    //         console.warn(`[Entity Store] Custom Callback Fn non è implementato per questa entità`);
    //         loaderService.stopSpinLoader();
    //         return EMPTY;
    //       }
    //       return service.customCallbackFn().pipe(      <-- Uso la funzione custom customCallbackFn
    //         distinctUntilChanged(),
    //         tapResponse({
    //           next: (entities) => {
    //             patchState(store, setEntities(entities), { loading: false });
    //             const proprietaK: K[] = entities.flatMap(e => e.proprietaK ?? []);     <-- Dopo il patch dello State, mi estraggo K[] dalla proprieta di T proprietaK
    //             if (proprietaK.length > 0) {
    //               storeK.upsertManyInStore(proprietaK);      <-- Vado ad aggiornare lo store di K
    //             }
    //             loaderService.stopSpinLoader();
    //           },
    //           error: (error: Error) => {
    //             const errorMsg = extractErrorMessage(error);
    //             messageService.add({
    //               severity: 'error',
    //               summary: `[Entity Store] Errore Caricamento`,
    //               detail: errorMsg
    //             });
    //             patchState(store, { loading: false, error: errorMsg });
    //             loaderService.stopSpinLoader();
    //           },
    //           complete: () => patchState(store, { loading: false })
    //         })
    //       );
    //     })
    //   )
    // ),
  }))
);
