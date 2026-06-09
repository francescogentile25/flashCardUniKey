import { patchState, withComputed, withMethods, withState } from "@ngrx/signals";
import {
  addEntity,
  addEntities,
  removeEntity,
  removeEntities,
  setAllEntities,
  setEntities,
  setEntity,
  updateEntity,
  withEntities
} from "@ngrx/signals/entities";
import { computed, inject, Type } from "@angular/core";
import { distinctUntilChanged, EMPTY, Observable, pipe, switchMap, tap } from "rxjs";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { tapResponse } from "@ngrx/operators";
import { MessageService } from "primeng/api";
import { SpinLoaderService } from '../services/spin-loader.service';
import { withDevtools } from "@angular-architects/ngrx-toolkit";
import { extractErrorMessage } from "../utils/extract-error-message.util";
import { PageOptionsModel, PageOptionsRequest, SortOrderEnum } from "../models/page-options.model";

// Tipizzazione base per le entità: ogni entità deve avere almeno un id
export type BaseEntity = {
  id: number | string;
}

// Stato base per il tracking delle operazioni CRUD e dello stato di caricamento
export type BaseEntityState<T extends BaseEntity = BaseEntity> = {
  loading: boolean;
  selectedEntity: T | undefined;
  selectedEntities: T[];
  lastCreated: T | undefined;
  lastUpdated: T | undefined;
  lastDeleted: number | string | undefined;
  lastDeletedResponse: any | undefined;  // Risposta dell'ultima operazione di delete
  error: string | undefined;

  // metadati paginazione lato backend
  currentPage?: number;          // corrisponde a PageOptionsRequest.page
  pageSize?: number;             // PageOptionsRequest.pageSize
  totalResults?: number;         // PageOptionsModel.totalResults
  totalPages?: number;           // PageOptionsModel.totalPages

  // opzionale: per allinearci a PageOptionsRequest
  sortField?: string;
  sortOrder?: SortOrderEnum;
  search?: string;               // lo useremo come "search"
}

// Interfaccia del servizio che deve essere implementata per utilizzare questo store
// Definisce tutti i metodi HTTP necessari per le operazioni CRUD
// Supporta tipi di richiesta e risposta personalizzati per ogni operazione CRUD
export interface BaseEntityService<
  T extends BaseEntity,
  TCreate = Omit<T, 'id'>,
  TUpdate = T,
  TPatch = Partial<T>,
  TDelete = number | string,
  TCreateResponse = T,
  TUpdateResponse = T,
  TPatchResponse = T,
  TDeleteResponse = any
> {
  getAll?(): Observable<T[]>;
  getById?(id: (number | string)): Observable<T>;
  add?(request: TCreate): Observable<TCreateResponse>;
  addMany?(request: TCreate[]): Observable<TCreateResponse[]>;
  edit?(request: TUpdate): Observable<TUpdateResponse>;
  patch?(request: TPatch): Observable<TPatchResponse>;
  delete?(request: TDelete): Observable<TDeleteResponse>;
  deleteMany?(request: TDelete[]): Observable<TDeleteResponse>;
  getPage?(request: PageOptionsRequest): Observable<PageOptionsModel<T>>;
}

// Factory function per creare la configurazione completa dello store
// Supporta tipi di richiesta e risposta personalizzati per ogni operazione CRUD tramite generics
export function createEntityStoreConfig<
  T extends BaseEntity,
  TCreate = Omit<T, 'id'>,
  TUpdate = T,
  TPatch = Partial<T>,
  TDelete = number | string,
  TCreateResponse = T,
  TUpdateResponse = T,
  TPatchResponse = T,
  TDeleteResponse = any
>(
  config: {
    storeName: string;
    serviceToken: Type<BaseEntityService<T, TCreate, TUpdate, TPatch, TDelete, TCreateResponse, TUpdateResponse, TPatchResponse, TDeleteResponse>>;
    useBackendPagination?: boolean; // Opzione per abilitare la paginazione lato backend
    showSuccessMessages?: boolean; // Opzione per disabilitare i messaggi di successo
    showErrorMessages?: boolean; // Opzione per disabilitare i messaggi di errore
    // Transformer functions per convertire le risposte custom in entità T o per estrarre dati
    transformCreateResponse?: (response: TCreateResponse) => T;
    transformCreateManyResponse?: (responses: TCreateResponse[]) => T[];
    transformUpdateResponse?: (response: TUpdateResponse) => T;
    transformPatchResponse?: (response: TPatchResponse) => T;
    transformDeleteResponse?: (response: TDeleteResponse) => any; // Opzionale: per estrarre/trasformare la risposta delete
  }
) {
  const showSuccess = config.showSuccessMessages ?? true;
  const showError = config.showErrorMessages ?? true;

  return [
    // Abilita la gestione automatica delle entità con NgRx Signals
    withEntities<T>(),

    // Integrazione con Redux DevTools per debugging
    withDevtools(config.storeName),

    // Definizione dello stato iniziale dello store
    withState<BaseEntityState<T>>({
      loading: false,
      selectedEntity: undefined,
      selectedEntities: [],
      lastCreated: undefined,
      lastUpdated: undefined,
      lastDeleted: undefined,
      lastDeletedResponse: undefined,
      error: undefined,
      currentPage: undefined,
      pageSize: undefined,
      totalResults: undefined,
      totalPages: undefined,
      sortField: undefined,
      sortOrder: undefined,
      search: undefined,
    }),

    // Computed signals: valori derivati dallo stato che si aggiornano automaticamente
    withComputed(({ entities, entityMap }) => ({
      // Conteggio totale delle entità
      count: computed(() => entities().length),

      // Verifica se lo store è vuoto
      isEmpty: computed(() => entities().length === 0),

      // Funzione per recuperare un'entità per ID usando la mappa
      entityById: computed(() => (id: number | string): T | undefined => entityMap()[id]),

      // Dizionario completo delle entità indicizzate per ID
      dictionary: computed(() => entityMap()),

      // Verifica se ci sono entità selezionate
      hasSelection: computed(() => entities().length > 0),
    })),

    // Metodi: tutte le azioni disponibili per manipolare lo store
    withMethods((store, service = inject(config.serviceToken), messageService = inject(MessageService), loaderService = inject(SpinLoaderService)) => ({

      // GESTIONE STATO BASE

      // Imposta un messaggio di errore
      setError: (error: string | undefined) => patchState(store, { error }),

      // Pulisce tutti gli errori
      clearError: () => patchState(store, { error: undefined }),

      // GESTIONE SELEZIONE SINGOLA

      // Seleziona un'entità specifica
      setSelectedEntity: (entity: T | undefined) => patchState(store, { selectedEntity: entity }),

      // Seleziona un'entità per ID
      selectEntityById: (id: number | string) => {
        const entity = store['entityById']()(id);
        if (entity) {
          patchState(store, { selectedEntity: entity });
        }
      },

      // Deseleziona l'entità corrente
      clearSelectedEntity: () => patchState(store, { selectedEntity: undefined }),

      // GESTIONE SELEZIONE MULTIPLA

      // Imposta un array di entità selezionate
      setSelectedEntities: (entities: T[]) => patchState(store, { selectedEntities: entities }),

      // Aggiunge un'entità alla selezione multipla
      addToSelection: (entity: T) => {
        const current = store['selectedEntities']();
        if (!current.find((e: T) => e.id === entity.id)) {
          patchState(store, { selectedEntities: [...current, entity] });
        }
      },

      // Rimuove un'entità dalla selezione multipla
      removeFromSelection: (id: number | string) => {
        patchState(store, {
          selectedEntities: store['selectedEntities']().filter((e: T) => e.id !== id)
        });
      },

      // Seleziona tutte le entità
      selectAll: () => patchState(store, { selectedEntities: store['entities']() }),

      // Deseleziona tutte le entità
      clearSelection: () => patchState(store, { selectedEntities: [] }),

      // Toggle di un'entità nella selezione
      toggleSelection: (entity: T) => {
        const current = store['selectedEntities']();
        const exists = current.find((e: T) => e.id === entity.id);

        if (exists) {
          patchState(store, {
            selectedEntities: current.filter((e: T) => e.id !== entity.id)
          });
        } else {
          patchState(store, {
            selectedEntities: [...current, entity]
          });
        }
      },

      // GESTIONE TRACKING ULTIMI CAMBIAMENTI

      // Traccia l'ultima entità creata
      setLastCreated: (entity: T) => patchState(store, { lastCreated: entity }),
      clearLastCreated: () => patchState(store, { lastCreated: undefined }),

      // Traccia l'ultima entità aggiornata
      setLastUpdated: (entity: T) => patchState(store, { lastUpdated: entity }),
      clearLastUpdated: () => patchState(store, { lastUpdated: undefined }),

      // Traccia l'ID dell'ultima entità eliminata e la risposta
      setLastDeleted: (id: number | string) => patchState(store, { lastDeleted: id }),
      clearLastDeleted: () => patchState(store, { lastDeleted: undefined }),
      setLastDeletedResponse: (response: any) => patchState(store, { lastDeletedResponse: response }),
      clearLastDeletedResponse: () => patchState(store, { lastDeletedResponse: undefined }),

      // MANIPOLAZIONE DIRETTA DELLO STORE (operazioni sincrone)

      // Aggiunge una singola entità allo store
      addOne: (entity: T) => patchState(store, addEntity(entity)),

      // Aggiunge multiple entità allo store
      addMany: (entities: T[]) => patchState(store, addEntities(entities)),

      // Sostituisce tutte le entità nello store
      setAll: (entities: T[]) => patchState(store, setAllEntities(entities)),

      // Aggiorna una singola entità nello store
      updateOne: (entity: T) => patchState(store, setEntity(entity)),

      // Aggiorna parzialmente un'entità nello store
      patchOne: (id: number | string, changes: Partial<T>) => patchState(store, updateEntity({ id, changes })),

      // Inserisce o aggiorna multiple entità
      upsertMany: (entities: T[]) => patchState(store, setEntities(entities)),

      // Rimuove una singola entità dallo store
      removeOne: (id: number | string) => patchState(store, removeEntity(id)),

      // Rimuove multiple entità dallo store
      removeMany: (ids: (number | string)[]) => patchState(store, removeEntities(ids)),

      // Pulisce completamente lo store
      clearAll: () => patchState(store, setAllEntities([])),

      // OPERAZIONI ASINCRONE (con chiamate HTTP)

      // Recupera tutte le entità dal server
      getAll$: rxMethod<void>(
        pipe(
          tap(() => {
            patchState(store, { loading: true, error: undefined });
            loaderService.startSpinLoader();
          }),
          switchMap(() => {
            if (!service.getAll) {
              console.warn(`[${ config.storeName }] Get All non è implementato per questa entità`);
              loaderService.stopSpinLoader();
              return EMPTY;
            }
            return service.getAll().pipe(
              distinctUntilChanged(),
              tapResponse({
                next: (entities) => {
                  patchState(store, setEntities(entities), { loading: false });
                  loaderService.stopSpinLoader();
                },
                error: (error: Error) => {
                  const errorMsg = extractErrorMessage(error);
                  if (showError) {
                    messageService.add({
                      severity: 'error',
                      summary: `[${config.storeName}] Errore Caricamento`,
                      detail: errorMsg
                    });
                  }
                  patchState(store, { loading: false, error: errorMsg });
                  loaderService.stopSpinLoader();
                },
                complete: () => patchState(store, { loading: false })
              })
            );
          })
        )
      ),

      // Recupera una singola entità per ID dal server
      getById$: rxMethod<number | string>(
        pipe(
          tap(() => {
            patchState(store, { loading: true, error: undefined });
            loaderService.startSpinLoader();
          }),
          switchMap((id) => {
            if (!service.getById) {
              console.warn(`[${ config.storeName }] Get By Id non è implementato per questa entità`);
              loaderService.stopSpinLoader();
              return EMPTY;
            }
            return service.getById(id).pipe(
              tapResponse({
                next: (entity) => {
                  patchState(store, setEntity(entity), { loading: false, selectedEntity: entity });
                  loaderService.stopSpinLoader();
                },
                error: (error: Error) => {
                  const errorMsg = extractErrorMessage(error);
                  if (showError) {
                    messageService.add({
                      severity: 'error',
                      summary: `[${config.storeName}] Errore Recupero`,
                      detail: errorMsg
                    });
                  }
                  patchState(store, { loading: false, error: errorMsg });
                  loaderService.stopSpinLoader();
                },
                complete: () => patchState(store, { loading: false })
              })
            );
          })
        )
      ),

      // Crea una nuova entità sul server
      add$: rxMethod<TCreate>(
        pipe(
          tap(() => {
            patchState(store, { loading: true, error: undefined });
            loaderService.startSpinLoader();
          }),
          switchMap((request) => {
            if (!service.add) {
              console.warn(`[${ config.storeName }] Add non è implementato per questa entità`);
              loaderService.stopSpinLoader();
              return EMPTY;
            }
            return service.add(request).pipe(
              distinctUntilChanged(),
              tapResponse({
                next: (response) => {
                  // Trasforma la risposta in entità T se necessario
                  const created = config.transformCreateResponse
                    ? config.transformCreateResponse(response)
                    : response as unknown as T;

                  patchState(store, addEntity(created), { loading: false, lastCreated: created });
                  if (showSuccess) {
                    messageService.add({
                      severity: 'success',
                      summary: `[${config.storeName}]`,
                      detail: 'Elemento aggiunto con successo'
                    });
                  }
                  loaderService.stopSpinLoader();
                },
                error: (error: Error) => {
                  const errorMsg = extractErrorMessage(error);
                  if (showError) {
                    messageService.add({
                      severity: 'error',
                      summary: `[${config.storeName}] Errore Creazione`,
                      detail: errorMsg
                    });
                  }
                  patchState(store, { loading: false, error: errorMsg });
                  loaderService.stopSpinLoader();
                },
                complete: () => patchState(store, { loading: false })
              })
            );
          })
        )
      ),

      // Crea multiple entità sul server
      addMany$: rxMethod<TCreate[]>(
        pipe(
          tap(() => {
            patchState(store, { loading: true, error: undefined });
            loaderService.startSpinLoader();
          }),
          switchMap((requests) => {
            if (!service.addMany) {
              console.warn(`[${ config.storeName }] Add Many non è implementato per questa entità.`);
              loaderService.stopSpinLoader();
              return EMPTY;
            }
            return service.addMany(requests).pipe(
              distinctUntilChanged(),
              tapResponse({
                next: (responses) => {
                  // Trasforma le risposte in entità T[] se necessario
                  const created = config.transformCreateManyResponse
                    ? config.transformCreateManyResponse(responses)
                    : responses as unknown as T[];

                  patchState(store, addEntities(created), { loading: false });
                  if (showSuccess) {
                    messageService.add({
                      severity: 'success',
                      summary: `[${config.storeName}]`,
                      detail: `${created.length} elementi aggiunti con successo`
                    });
                  }
                  loaderService.stopSpinLoader();
                },
                error: (error: Error) => {
                  const errorMsg = extractErrorMessage(error);
                  if (showError) {
                    messageService.add({
                      severity: 'error',
                      summary: `[${config.storeName}] Errore Creazione Multipla`,
                      detail: errorMsg
                    });
                  }
                  patchState(store, { loading: false, error: errorMsg });
                  loaderService.stopSpinLoader();
                },
                complete: () => patchState(store, { loading: false })
              })
            );
          })
        )
      ),

      // Aggiorna completamente un'entità sul server
      edit$: rxMethod<TUpdate>(
        pipe(
          tap(() => {
            patchState(store, { loading: true, error: undefined });
            loaderService.startSpinLoader();
          }),
          switchMap((request) => {
            if (!service.edit) {
              console.warn(`[${ config.storeName }] Edit non è implementato per questa entità`);
              loaderService.stopSpinLoader();
              return EMPTY;
            }
            return service.edit(request).pipe(
              distinctUntilChanged(),
              tapResponse({
                next: (response) => {
                  // Trasforma la risposta in entità T se necessario
                  const updated = config.transformUpdateResponse
                    ? config.transformUpdateResponse(response)
                    : response as unknown as T;

                  patchState(store, setEntity(updated), { loading: false, lastUpdated: updated });
                  if (showSuccess) {
                    messageService.add({
                      severity: 'success',
                      summary: `[${config.storeName}]`,
                      detail: 'Elemento aggiornato con successo'
                    });
                  }
                  loaderService.stopSpinLoader();
                },
                error: (error: Error) => {
                  const errorMsg = extractErrorMessage(error);
                  if (showError) {
                    messageService.add({
                      severity: 'error',
                      summary: `[${config.storeName}] Errore Modifica`,
                      detail: errorMsg
                    });
                  }
                  patchState(store, { loading: false, error: errorMsg });
                  loaderService.stopSpinLoader();
                },
                complete: () => patchState(store, { loading: false })
              })
            );
          })
        )
      ),

      // Aggiorna parzialmente un'entità sul server
      patch$: rxMethod<TPatch>(
        pipe(
          tap(() => {
            patchState(store, { loading: true, error: undefined });
            loaderService.startSpinLoader();
          }),
          switchMap((request) => {
            if (!service.patch) {
              console.warn(`[${ config.storeName }] Patch non è implementato per questa entità`);
              loaderService.stopSpinLoader();
              return EMPTY;
            }
            return service.patch(request).pipe(
              distinctUntilChanged(),
              tapResponse({
                next: (response) => {
                  // Trasforma la risposta in entità T se necessario
                  const patched = config.transformPatchResponse
                    ? config.transformPatchResponse(response)
                    : response as unknown as T;

                  patchState(store, setEntity(patched), { loading: false, lastUpdated: patched });
                  if (showSuccess) {
                    messageService.add({
                      severity: 'success',
                      summary: `[${config.storeName}]`,
                      detail: 'Elemento aggiornato con successo'
                    });
                  }
                  loaderService.stopSpinLoader();
                },
                error: (error: Error) => {
                  const errorMsg = extractErrorMessage(error);
                  if (showError) {
                    messageService.add({
                      severity: 'error',
                      summary: `[${config.storeName}] Errore Aggiornamento Parziale`,
                      detail: errorMsg
                    });
                  }
                  patchState(store, { loading: false, error: errorMsg });
                  loaderService.stopSpinLoader();
                },
                complete: () => patchState(store, { loading: false })
              })
            );
          })
        )
      ),

      // Elimina una singola entità dal server
      delete$: rxMethod<number | string>(
        pipe(
          tap(() => {
            patchState(store, { loading: true, error: undefined });
            loaderService.startSpinLoader();
          }),
          switchMap((id) => {
            if (!service.delete) {
              console.warn(`[${ config.storeName }] Delete non è implementato per questa entità`);
              loaderService.stopSpinLoader();
              return EMPTY;
            }
            return service.delete(id as TDelete).pipe(
              distinctUntilChanged(),
              tapResponse({
                next: (response) => {
                  // Trasforma la risposta se necessario
                  const transformedResponse = config.transformDeleteResponse
                    ? config.transformDeleteResponse(response)
                    : response;

                  patchState(store, removeEntity(id), {
                    loading: false,
                    lastDeleted: id,
                    lastDeletedResponse: transformedResponse
                  });
                  if (showSuccess) {
                    messageService.add({
                      severity: 'success',
                      summary: `[${config.storeName}]`,
                      detail: 'Elemento rimosso con successo'
                    });
                  }
                  loaderService.stopSpinLoader();
                },
                error: (error: Error) => {
                  const errorMsg = extractErrorMessage(error);
                  if (showError) {
                    messageService.add({
                      severity: 'error',
                      summary: `[${config.storeName}] Errore Eliminazione`,
                      detail: errorMsg
                    });
                  }
                  patchState(store, { loading: false, error: errorMsg });
                  loaderService.stopSpinLoader();
                },
                complete: () => patchState(store, { loading: false })
              })
            );
          })
        )
      ),

      // Elimina multiple entità dal server
      deleteMany$: rxMethod<(number | string)[]>(
        pipe(
          tap(() => {
            patchState(store, { loading: true, error: undefined });
            loaderService.startSpinLoader();
          }),
          switchMap((ids) => {
            if (!service.deleteMany) {
              console.warn(`[${ config.storeName }] Delete Many non è implementato per questa entità`);
              loaderService.stopSpinLoader();
              return EMPTY;
            }
            return service.deleteMany(ids as TDelete[]).pipe(
              distinctUntilChanged(),
              tapResponse({
                next: (response) => {
                  // Trasforma la risposta se necessario
                  const transformedResponse = config.transformDeleteResponse
                    ? config.transformDeleteResponse(response)
                    : response;

                  patchState(store, removeEntities(ids), {
                    loading: false,
                    lastDeletedResponse: transformedResponse
                  });
                  if (showSuccess) {
                    messageService.add({
                      severity: 'success',
                      summary: `[${config.storeName}]`,
                      detail: `${ids.length} elementi rimossi con successo`
                    });
                  }
                  loaderService.stopSpinLoader();
                },
                error: (error: Error) => {
                  const errorMsg = extractErrorMessage(error);
                  if (showError) {
                    messageService.add({
                      severity: 'error',
                      summary: `[${config.storeName}] Errore Eliminazione Multipla`,
                      detail: errorMsg
                    });
                  }
                  patchState(store, { loading: false, error: errorMsg });
                  loaderService.stopSpinLoader();
                },
                complete: () => patchState(store, { loading: false })
              })
            );
          })
        )
      ),

      // Elimina le entità selezionate
      deleteSelected$: rxMethod<void>(
        pipe(
          tap(() => {
            const selectedIds = store['selectedEntities']().map((e: T) => e.id);
            if (selectedIds.length === 0) {
              messageService.add({
                severity: 'warn',
                summary: `[${config.storeName}]`,
                detail: 'Nessun elemento selezionato'
              });
              return;
            }
            patchState(store, { loading: true, error: undefined });
            loaderService.startSpinLoader();
          }),
          switchMap(() => {
            if (!service.deleteMany) {
              console.warn(`[${ config.storeName }] Delete Selected non è implementato per questa entità`);
              loaderService.stopSpinLoader();
              return EMPTY;
            }

            const selectedIds = store['selectedEntities']().map((e: T) => e.id);
            if (selectedIds.length === 0) return EMPTY;

            return service.deleteMany(selectedIds).pipe(
              tapResponse({
                next: (response) => {
                  // Trasforma la risposta se necessario
                  const transformedResponse = config.transformDeleteResponse
                    ? config.transformDeleteResponse(response)
                    : response;

                  patchState(store, removeEntities(selectedIds), {
                    loading: false,
                    selectedEntities: [],
                    lastDeletedResponse: transformedResponse
                  });
                  if (showSuccess) {
                    messageService.add({
                      severity: 'success',
                      summary: `[${config.storeName}]`,
                      detail: `${selectedIds.length} elementi selezionati rimossi`
                    });
                  }
                  loaderService.stopSpinLoader();
                },
                error: (error: Error) => {
                  const errorMsg = extractErrorMessage(error);
                  if (showError) {
                    messageService.add({
                      severity: 'error',
                      summary: `[${config.storeName}] Errore Eliminazione Selezione`,
                      detail: errorMsg
                    });
                  }
                  patchState(store, { loading: false, error: errorMsg });
                  loaderService.stopSpinLoader();
                },
                complete: () => patchState(store, { loading: false })
              })
            );
          })
        )
      ),

      // UTILITY

      // Ricarica tutte le entità dal server
      refresh$: rxMethod<void>(
        pipe(
          tap(() => {
            patchState(store, { loading: true, error: undefined });
            loaderService.startSpinLoader();
          }),
          switchMap(() => {
            if (!service.getAll) {
              console.warn(`[${ config.storeName }] (refresh$) Get All non è implementato per questa entità`);
              loaderService.stopSpinLoader();
              return EMPTY;
            }
            return service.getAll().pipe(
              distinctUntilChanged(),
              tapResponse({
                next: (entities) => {
                  patchState(store, setAllEntities(entities), { loading: false });
                  if (showSuccess) {
                    messageService.add({
                      severity: 'info',
                      summary: `[${config.storeName}]`,
                      detail: 'Dati aggiornati'
                    });
                  }
                  loaderService.stopSpinLoader();
                },
                error: (error: Error) => {
                  const errorMsg = extractErrorMessage(error);
                  if (showError) {
                    messageService.add({
                      severity: 'error',
                      summary: `[${config.storeName}] Errore Aggiornamento`,
                      detail: errorMsg
                    });
                  }
                  patchState(store, { loading: false, error: errorMsg });
                  loaderService.stopSpinLoader();
                },
                complete: () => patchState(store, { loading: false })
              })
            )
          })
        )
      ),

      loadPage$: rxMethod<Partial<PageOptionsRequest>>(
        pipe(
          tap((options) => {
            patchState(store, {
              loading: true,
              error: undefined,
              currentPage: options.page ?? store['currentPage'](),
              pageSize: options.pageSize ?? store['pageSize'](),
              sortField: options.sortField ?? store['sortField'](),
              sortOrder: options.sortOrder ?? store['sortOrder'](),
              search: options.search ?? store['search'](),
            });
            loaderService.startSpinLoader();
          }),
          switchMap(() => {
            if (!service.getPage) {
              console.warn(`[${ config.storeName }] Get Page non è implementato per questa entità`);
              loaderService.stopSpinLoader();
              return EMPTY;
            }
            if (!config.useBackendPagination) {
              console.warn(`[${ config.storeName }] Paginazione Lato backend non abilitato lato store`);
              loaderService.stopSpinLoader();
              return EMPTY;
            }
            return service.getPage({
              page: store['currentPage'](),
              pageSize: store['pageSize'](),
              sortField: store['sortField'](),
              sortOrder: store['sortOrder'](),
              search: store['search']()
            }).pipe(
              distinctUntilChanged(),
              tapResponse({
                next: (page) => {
                  patchState(
                    store,
                    {
                      loading: false,
                      currentPage: page.currentPage,
                      pageSize: page.pageSize,
                      totalResults: page.totalResults,
                      totalPages: page.totalPages
                    },
                    setAllEntities(page.results ?? [])
                  );
                  loaderService.stopSpinLoader();
                },
                error: (error: Error) => {
                  const errorMsg = extractErrorMessage(error);
                  patchState(store, { loading: false, error: errorMsg });
                  if (showError) {
                    messageService.add({
                      severity: 'error',
                      summary: `[${config.storeName}] Errore Caricamento Pagina`,
                      detail: errorMsg
                    });
                  }
                  loaderService.stopSpinLoader();
                }
              })
            );
          })
        )
      ),

      // Reset completo dello store allo stato iniziale
      reset: () => patchState(store, {
        loading: false,
        selectedEntity: undefined,
        selectedEntities: [],
        lastCreated: undefined,
        lastUpdated: undefined,
        lastDeleted: undefined,
        lastDeletedResponse: undefined,
        error: undefined,
        currentPage: undefined,
        pageSize: undefined,
        totalResults: undefined,
        totalPages: undefined,
        sortField: undefined,
        sortOrder: undefined,
        search: undefined,
      }, setAllEntities([])),
    }))
  ] as const;
}
