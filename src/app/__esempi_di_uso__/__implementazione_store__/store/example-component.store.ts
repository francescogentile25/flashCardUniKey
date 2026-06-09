import { signalStore } from "@ngrx/signals";
import { createEntityStoreConfig } from "../../../core/store/base.store";
import { EntityResponse } from "../models/responses/entity.response";
import { ExampleComponentService } from "../services/example-component.service";

export const ExampleComponentStore = signalStore(
  { providedIn: 'root' },
  ...createEntityStoreConfig<EntityResponse>({
    storeName: 'Entity Store',
    serviceToken: ExampleComponentService,
    useBackendPagination: false, // Opzione per abilitare la paginazione lato backend
    showSuccessMessages: true, // Opzione per disabilitare i messaggi di successo
    showErrorMessages: true // Opzione per disabilitare i messaggi di errore
  })
);
