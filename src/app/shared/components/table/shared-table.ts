import { Component, computed, effect, inject, input, model, output, signal, untracked, viewChild } from '@angular/core';
import { ConfirmationService, SortEvent } from "primeng/api";
import { Table, TableModule } from "primeng/table";
import { TableConfigModel } from "./models/table-config.model";
import { ActionViewEnum } from "./models/enums/action-view.enum";
import { ActionTypeEnum } from "./models/enums/action-type.enum";
import { ExpandableRowModeEnum } from "./models/enums/expandable-row-mode.enum";
import { ColumnsConfigModel } from "./models/columns-config.model";
import { ActionConfigModel } from "./models/actions-config.model";
import { Observable } from "rxjs";
import { Router } from "@angular/router";
import { NgClass, NgStyle, TitleCasePipe, UpperCasePipe } from "@angular/common";
import moment from "moment/moment";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { TableCell } from "./components/table-cell/table-cell";
import { ActionClickEvent, TableActions } from "./components/table-actions/table-actions";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { InputText } from "primeng/inputtext";
import { TrimSpaces } from "../../directives/trim-spaces.directive";
import { Button } from "primeng/button";
import { Tooltip } from "primeng/tooltip";
import { SeverityEnum } from "../../../core/utils/primeng.util";
import { PageOptionsRequest, SortOrderEnum } from "../../../core/models/page-options.model";
import { AddRecordConfigModel } from "./models/add-record-config.model";
import { ExportConfigModel } from "./models/export-config.model";

@Component({
  selector: 'app-shared-table',
  imports: [
    TableModule,
    UpperCasePipe,
    TitleCasePipe,
    NgClass,
    NgStyle,
    FormsModule,
    TableCell,
    TableActions,
    IconField,
    InputIcon,
    InputText,
    TrimSpaces,
    ReactiveFormsModule,
    Button,
    Tooltip
  ],
  templateUrl: './shared-table.html',
  styleUrl: './shared-table.scss'
})
// Componente generico di tabella condivisa con supporto ad azioni, paginazione, filtro e righe espandibili
export class SharedTable<IdType extends string | number, T extends { id: IdType }, E extends object = never> {
  // Router per navigazioni interne (azioni di tipo Route)
  private router = inject(Router);

  // Servizio di conferma per dialog di conferma azioni
  private confirmationService = inject(ConfirmationService);

  // Espone moment per formattazioni date nel template
  public readonly moment = moment;

  // Riferimento alla p-table (usato per accedere ad API interne se necessario)
  table = viewChild<Table>('dt');

  // Configurazione completa della tabella (colonne, azioni, paginazione, ecc.)
  tableConfig = input.required<TableConfigModel<T, E>>();

  // Dati "raw" ricevuti dal chiamante (senza filtri locali applicati)
  rawData = signal<T[]>([]);

  // Dati effettivamente mostrati in tabella (dopo filtro locale)
  data = signal<T[]>([]);

  // Stato di espansione per ogni riga (id → true/false)
  expandedRows = signal<{ [key: string]: boolean }>({});

  // Valore del filtro di ricerca globale
  filterInput = model<string>('');

  // Output con le entità selezionate (per checkbox selection)
  selectedEntitiesOutput = output<T[]>();

  // Stato locale delle entità selezionate
  selectedEntities = model<T[]>([]);

  // Indica se è configurata la paginazione
  hasPagination = computed(() => !!this.tableConfig().paginationConfig);

  // Indica se la paginazione è gestita da backend
  hasBackendPagination = computed(() => this.hasPagination() && !!this.tableConfig().paginationConfig!.backendConfig);

  // Indice del primo record della pagina corrente
  first = signal<number>(0);

  // Numero di righe visualizzate per pagina
  rows = signal<number>(10);

  // Opzioni per il numero di righe per pagina
  rowsPerPageOptions = computed(() =>
    this.hasPagination()
      ? this.tableConfig().paginationConfig!.rowsPerPageOptions
      : [10, 20, 30, 40, 50]
  );

  // Numero totale di record (locale o da backend)
  totalRecords = computed(() =>
    this.hasBackendPagination()
      ? (this.tableConfig().paginationConfig?.backendConfig?.pageOptions.totalResults ?? 0)
      : this.rawData().length
  );

  // Page size corrente (locale o da backend)
  pageSize = computed(() =>
    this.hasBackendPagination()
      ? (this.tableConfig().paginationConfig?.backendConfig?.pageOptions.pageSize ?? 0)
      : (this.tableConfig().paginationConfig ? (this.tableConfig().paginationConfig?.rows ?? 10) : 10)
  );

  // Indica se la tabella ha righe espandibili
  hasExpandableRows = computed(() =>
    this.tableConfig().expandableRowsConfig !== undefined
  );

  // Indica se la tabella ha una colonna azioni configurata
  hasActions = computed(() =>
    this.tableConfig().actionsConfig !== undefined
  );

  // Indica se il filtro globale è abilitato
  hasFilter = computed(() => !!this.tableConfig().tableFilter);

  // Indica se il filtro è gestito in locale (no backendConfig)
  hasLocalFilter = computed(() =>
    this.tableConfig().tableFilter && (this.tableConfig().paginationConfig ? !this.tableConfig().paginationConfig?.backendConfig : true)
  );

  // Indica se il filtro è gestito dal backend (presenza backendConfig)
  hasBackendFilter = computed(() =>
    this.tableConfig().tableFilter && (this.tableConfig().paginationConfig ? !!this.tableConfig().paginationConfig?.backendConfig : false)
  );

  // Indica se l'ordinamento è gestito dal backend
  hasBackendSort = computed(() =>
    this.tableConfig().tableSortable && (this.tableConfig().paginationConfig ? !!this.tableConfig().paginationConfig?.backendConfig : false)
  );

  // Indica se è configurata la funzione "Aggiungi record"
  hasAddRecordFn = computed(() =>
    !!this.tableConfig().addRecordConfig
  );

  // Indica se è configurata la funzione di export dati
  hasExportDataFn = computed(() => !!this.tableConfig().exportConfig);

  // Indica se l'export usa la selezione da checkbox (passa gli id selezionati)
  hasExportDataWithSelectedEntities = computed(() => this.hasExportDataFn() && this.tableConfig().exportConfig!.fromCheckboxSelection)

  // Indica se la tabella espansa ha un pulsante "Aggiungi record"
  hasExpandedTableAddRecordFn = computed(() =>
    !!this.tableConfig().expandableRowsConfig?.addRecordConfig
  );

  // Indica se la tabella espansa ha azioni configurate
  hasExpandedActions = computed(() => {
    const cfg: any = this.tableConfig().expandableRowsConfig;
    return !!cfg?.actionsConfig && !!cfg.actionsConfig.actions?.length;
  });

  constructor() {

    // Effetto che reagisce ai cambiamenti delle entities in ingresso
    effect(() => {
      const entities = this.tableConfig().entities;

      untracked(() => {
        // Aggiorna i dati raw mantenendo un nuovo array
        this.rawData.set([...entities]);

        // Aggiorna le righe per pagina sulla base della pageSize corrente
        this.rows.set(this.pageSize());

        // Applica filtro locale (se abilitato)
        this.applyFiltersAndSorting();
      });
    });

    // Effetto che reagisce ai cambiamenti del filtro globale
    effect(() => {
      const filterValue = this.filterInput();

      untracked(() => {
        if (this.hasLocalFilter()) {
          // Applica il filtro in locale
          this.applyFiltersAndSorting();
        } else if (this.hasBackendFilter()) {
          // Delega la ricerca al backend
          const request: PageOptionsRequest = {
            search: filterValue
          }
          this.tableConfig().paginationConfig!.backendConfig!.pageChange(request);
        }
      });
    });
  }

  // Applica il filtro locale (e futura logica di sort locale se necessaria)
  applyFiltersAndSorting(): void {
    let result = [...this.rawData()];
    const query = this.filterInput()?.trim().toLowerCase();
    if (query) {
      result = result.filter(entity => this.deepSearch(entity, query));
    }
    this.data.set(result);
  }

  // Gestisce l'evento di ordinamento quando la sort è delegata al backend
  onBackendSort(event: SortEvent): void {
    if (!this.hasBackendSort()) {
      return;
    }
    const field = event.field;
    const order = event.order; // 0, 1, -1

    const backendConfig = this.tableConfig().paginationConfig?.backendConfig;
    if (!backendConfig) {
      return;
    }

    if (!field || !order || order === 0) {
      backendConfig.pageChange({
        sortField: undefined,
        sortOrder: SortOrderEnum.None });
    } else {
      backendConfig.pageChange({
        sortField: field,
        sortOrder: order === 1 ? SortOrderEnum.Asc : SortOrderEnum.Desc
      });
    }
  }

  // Ricerca ricorsiva full-text sui valori dell'entità, con supporto a più token
  deepSearch(value: any, query: string): boolean {
    if (value == null) return false;

    const tokens = query
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    if (tokens.length === 0) {
      return false;
    }

    // Ogni token deve essere presente da qualche parte nella struttura dati
    return tokens.every(token => this.deepSearchToken(value, token));
  }

  // Ricerca di un singolo token all'interno di un valore arbitrario
  private deepSearchToken(value: any, token: string): boolean {
    if (value == null) return false;

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value).toLowerCase().includes(token);
    }

    if (value instanceof Date) {
      return value.toLocaleDateString('it-IT').toLowerCase().includes(token);
    }

    if (Array.isArray(value)) {
      return value.some(item => this.deepSearchToken(item, token));
    }

    if (typeof value === 'object') {
      return Object.values(value).some(val => this.deepSearchToken(val, token));
    }

    return false;
  }

  // Restituisce i dati da mostrare nella riga espansa in base alla modalità configurata
  getExpandedRowData(rowData: T): any[] {
    const config = this.tableConfig().expandableRowsConfig;
    if (!config) return [];

    if ((config as any).mode === ExpandableRowModeEnum.Inline) {
      return this.getInlineExpandedRowData(rowData);
    }

    return this.getRelationOrProviderExpandedRowData(rowData) as any[];
  }

  // Modalità Inline: la riga espansa mostra la stessa entità T
  getInlineExpandedRowData(rowData: T): T[] { return [rowData]; }

  // Modalità RelationProperty/EntitiesProvider: determina i figli a partire dal parent
  getRelationOrProviderExpandedRowData(rowData: T): E[] {
    const config = this.tableConfig().expandableRowsConfig as
      | { mode: ExpandableRowModeEnum.RelationProperty; relationProperty: keyof T }
      | { mode: ExpandableRowModeEnum.EntitiesProvider; entitiesProvider: (parent: T) => E[] };

    if (config.mode === ExpandableRowModeEnum.RelationProperty) {
      return (rowData as any)[config.relationProperty] || [];
    } else {
      return config.entitiesProvider(rowData);
    }
  }

  // Restituisce la modalità di visualizzazione delle azioni nella tabella espansa
  getExpandedActionsView(): ActionViewEnum {
    const cfg: any = this.tableConfig().expandableRowsConfig;
    return cfg?.actionsConfig?.actionView || ActionViewEnum.IconButtons;
  }

  // Restituisce il numero massimo di azioni inline nella tabella espansa
  getExpandedMaxInlineActions(): number {
    const cfg: any = this.tableConfig().expandableRowsConfig;
    return cfg?.actionsConfig?.maxInlineActions || 2;
  }

  // Restituisce la configurazione colonne per la tabella espansa
  getExpandedColumnsConfig(): ColumnsConfigModel<any>[] {
    const config = this.tableConfig().expandableRowsConfig;
    if (!config) return [];

    return config.columnsConfig;
  }

  // Restituisce il titolo della tabella espansa (gestisce sia string che function)
  getExpandedTableTitle(rowData: T): string {
    const cfg = this.tableConfig().expandableRowsConfig;
    if (!cfg) return '';
    const title = cfg.tableTitle;
    const expandedData = this.getExpandedRowData(rowData);
    return typeof title === 'function' ? title(expandedData) : title;
  }

  // Restituisce il sottotitolo della tabella espansa (gestisce sia string che function)
  getExpandedTableSubtitle(rowData: T): string | undefined {
    const cfg = this.tableConfig().expandableRowsConfig;
    if (!cfg || !cfg.tableSubtitle) return undefined;
    const subtitle = cfg.tableSubtitle;
    const expandedData = this.getExpandedRowData(rowData);
    return typeof subtitle === 'function' ? subtitle(expandedData) : subtitle;
  }

  // Restituisce la label della colonna azioni nella tabella espansa (gestisce sia string che function)
  getExpandedActionsColumnLabel(rowData: T): string {
    const cfg = this.tableConfig().expandableRowsConfig as any;
    if (!cfg?.actionsConfig) return 'Azioni';
    const label = cfg.actionsConfig.customColumnLabel;
    if (!label) return 'Azioni';
    const expandedData = this.getExpandedRowData(rowData);
    return typeof label === 'function' ? label(expandedData) : label;
  }

  // Restituisce la label del pulsante "Aggiungi record" nella tabella espansa (gestisce sia string che function)
  getExpandedAddRecordLabel(): string {
    const cfg = this.tableConfig().expandableRowsConfig;
    if (!cfg?.addRecordConfig) return '';
    const label = cfg.addRecordConfig.label;
    return typeof label === 'function' ? label() : label;
  }

  // Restituisce l'icona del pulsante "Aggiungi record" nella tabella espansa (gestisce sia string che function)
  getExpandedAddRecordIcon(): string | undefined {
    const cfg = this.tableConfig().expandableRowsConfig;
    if (!cfg?.addRecordConfig?.icon) return undefined;
    const icon = cfg.addRecordConfig.icon;
    return typeof icon === 'function' ? icon() : icon;
  }

  // Restituisce il tooltip del pulsante "Aggiungi record" nella tabella espansa (gestisce sia string che function)
  getExpandedAddRecordTooltip(): string {
    const cfg = this.tableConfig().expandableRowsConfig;
    if (!cfg?.addRecordConfig) return '';
    const tooltip = cfg.addRecordConfig.tooltip;
    if (!tooltip) return this.getExpandedAddRecordLabel();
    return typeof tooltip === 'function' ? tooltip() : tooltip;
  }

  // Gestisce l'esecuzione di una azione di riga, con eventuale conferma
  executeAction(action: ActionConfigModel<T>, rowData?: T): void {
    if (action.disabled) return;

    // Se c'è un dialog di conferma, lo mostra prima dell'esecuzione
    if (action.confirmDialogConfig) {
      this.confirmationService.confirm({
        message: action.confirmDialogConfig.message,
        header: action.confirmDialogConfig.header || 'Conferma',
        icon: action.confirmDialogConfig.icon || 'pi pi-exclamation-triangle',
        acceptLabel: action.confirmDialogConfig.acceptLabel || 'Conferma',
        rejectLabel: action.confirmDialogConfig.rejectLabel || 'Annulla',
        acceptButtonProps: action.confirmDialogConfig.acceptButtonProps,
        rejectButtonProps: action.confirmDialogConfig.rejectButtonProps || { variant: 'text', severity: SeverityEnum.Secondary },
        acceptButtonStyleClass: action.confirmDialogConfig.acceptButtonStyleClass,
        rejectButtonStyleClass: action.confirmDialogConfig.rejectButtonStyleClass,
        accept: () => this.performAction(action, rowData)
      });
    } else {
      this.performAction(action, rowData);
    }
  }

  // Esegue concretamente l'azione in base al tipo ActionTypeEnum
  private performAction(action: ActionConfigModel<T>, rowData?: T): void {
    switch (action.actionType) {
      case ActionTypeEnum.Fn:
        if (action.fn) {
          action.fn(rowData);
        }
        break;

      case ActionTypeEnum.AsyncFn:
        if (action.fn) {
          const result = action.fn?.(rowData);
          if (!result) return;

          // Gestione Observable
          if ('subscribe' in result) {
            (result as Observable<any>).subscribe({
              next: res => console.log('Action completed:', res),
              error: err => console.error('Action error:', err),
              complete: () => console.log('Action finished')
            });
          }
          // Gestione Promise
          else if ('then' in result) {
            (result as Promise<any>)
              .then(res => console.log('Action completed:', res))
              .catch(err => console.error('Action error:', err));
          }
        }
        break;

      case ActionTypeEnum.Route:
        if (action.url) {
          this.router.navigateByUrl(action.url);
        }
        break;

      case ActionTypeEnum.Download:
        // Punto di estensione per logica di download
        console.log('Download action', rowData);
        break;

      case ActionTypeEnum.External:
        if (action.url) {
          window.open(action.url, '_blank');
        }
        break;

      default:
        if (action.fn) {
          action.fn(rowData);
        }
    }
  }

  // Gestore del pulsante "Aggiungi record" (stessa logica delle azioni ma senza rowData)
  addRecordHandler(action?: AddRecordConfigModel): void {
    if (!action) {
      return;
    }
    switch (action.actionType) {
      case ActionTypeEnum.Fn:
        if (action.fn) {
          action.fn();
        }
        break;

      case ActionTypeEnum.AsyncFn:
        if (action.fn) {
          const result = action.fn?.();
          if (!result) return;

          // Gestione Observable
          if ('subscribe' in result) {
            (result as Observable<any>).subscribe({
              next: res => console.log('Action completed:', res),
              error: err => console.error('Action error:', err),
              complete: () => console.log('Action finished')
            });
          }
          // Gestione Promise
          else if ('then' in result) {
            (result as Promise<any>)
              .then(res => console.log('Action completed:', res))
              .catch(err => console.error('Action error:', err));
          }
        }
        break;

      case ActionTypeEnum.Route:
        if (action.url) {
          this.router.navigateByUrl(action.url);
        }
        break;

      case ActionTypeEnum.Download:
        // Punto di estensione per logica di download
        console.log('Download action');
        break;

      case ActionTypeEnum.External:
        if (action.url) {
          window.open(action.url, '_blank');
        }
        break;

      default:
        if (action.fn) {
          action.fn();
        }
    }
  }

  // Gestore per evento di click proveniente dal componente TableActions
  onActionClick(event: ActionClickEvent<T>): void {
    this.executeAction(event.action, event.rowData);
  }

  // Restituisce la modalità di visualizzazione delle azioni per la tabella principale
  getActionsView(): ActionViewEnum {
    return this.tableConfig().actionsConfig?.actionView || ActionViewEnum.IconButtons;
  }

  // Restituisce il numero massimo di azioni inline per la tabella principale
  getMaxInlineActions(): number {
    return this.tableConfig().actionsConfig?.maxInlineActions || 2;
  }

  // Gestisce il click sul pulsante di export dati
  exportDataHandler(config?: ExportConfigModel): void {
    if (!config?.fn) return;

    if (config.fromCheckboxSelection) {
      const ids = this.selectedEntities().map(e => e.id) as (number | string)[];
      config.fn(ids);
    } else {
      config.fn();
    }
  }

  // Gestisce il cambio pagina della p-table (sia locale che backend)
  onPageChange(event: any): void {
    this.first.set(event.first);
    this.rows.set(event.rows);

    if (this.hasBackendPagination()) {
      const page = Math.floor(event.first / event.rows) + 1;
      const request: PageOptionsRequest = {
        page: page,
        pageSize: event.rows
      }
      this.tableConfig().paginationConfig!.backendConfig!.pageChange(request);
    }
  }

  // Restituisce il titolo della tabella (gestisce sia string che function)
  displayTableTitle = computed(() => {
    const title = this.tableConfig().tableTitle;
    return typeof title === 'function' ? title(this.data()) : title;
  });

  // Restituisce il sottotitolo della tabella (gestisce sia string che function)
  displayTableSubtitle = computed(() => {
    const subtitle = this.tableConfig().tableSubtitle;
    if (!subtitle) return undefined;
    return typeof subtitle === 'function' ? subtitle(this.data()) : subtitle;
  });

  // Restituisce la label della colonna azioni (gestisce sia string che function)
  displayActionsColumnLabel = computed(() => {
    const label = this.tableConfig().actionsConfig?.customColumnLabel;
    if (!label) return 'Azioni';
    return typeof label === 'function' ? label(this.data()) : label;
  });

  // Restituisce la label del pulsante "Aggiungi record" (gestisce sia string che function)
  displayAddRecordLabel = computed(() => {
    const label = this.tableConfig().addRecordConfig?.label;
    if (!label) return '';
    return typeof label === 'function' ? label() : label;
  });

  // Restituisce l'icona del pulsante "Aggiungi record" (gestisce sia string che function)
  displayAddRecordIcon = computed(() => {
    const icon = this.tableConfig().addRecordConfig?.icon;
    if (!icon) return undefined;
    return typeof icon === 'function' ? icon() : icon;
  });

  // Restituisce il tooltip del pulsante "Aggiungi record" (gestisce sia string che function)
  displayAddRecordTooltip = computed(() => {
    const tooltip = this.tableConfig().addRecordConfig?.tooltip;
    if (!tooltip) return this.displayAddRecordLabel();
    return typeof tooltip === 'function' ? tooltip() : tooltip;
  });

  // Restituisce la label del pulsante export (gestisce sia string che function)
  displayExportLabel = computed(() => {
    const label = this.tableConfig().exportConfig?.label;
    if (!label) return '';
    const selectedIds = this.selectedEntities().map(e => e.id) as (number | string)[];
    return typeof label === 'function' ? label(selectedIds) : label;
  });

  // Restituisce l'icona del pulsante export (gestisce sia string che function)
  displayExportIcon = computed(() => {
    const icon = this.tableConfig().exportConfig?.icon;
    if (!icon) return undefined;
    return typeof icon === 'function' ? icon() : icon;
  });

  // Restituisce il tooltip del pulsante export (gestisce sia string che function)
  displayExportTooltip = computed(() => {
    const tooltip = this.tableConfig().exportConfig?.tooltip;
    const selectedIds = this.selectedEntities().map(e => e.id) as (number | string)[];
    if (!tooltip) return this.displayExportLabel();
    return typeof tooltip === 'function' ? tooltip(selectedIds) : tooltip;
  });

  // Restituisce la label della colonna (customLabel o nome proprietà) (gestisce sia string che function)
  getColumnLabel(column: ColumnsConfigModel<T>): string {
    if (!column.customLabel) return column.property as string;
    return typeof column.customLabel === 'function' ? column.customLabel(this.data()) : column.customLabel;
  }

  // Indica se una colonna è ordinabile
  isColumnSortable(column: ColumnsConfigModel<T>): boolean {
    if (this.tableConfig().tableSortable === undefined) return false;
    return !!column.sortableColumn;
  }

  // Restituisce la classe CSS della riga in base alla configurazione condizionale
  getRowClass(rowData: T): string {
    const conditionalConfig = this.tableConfig().conditionalRowConfig;
    if (conditionalConfig?.ngClass) {
      return conditionalConfig.ngClass(rowData);
    }
    return !!this.tableConfig().expandableRowsConfig ? 'cursor-pointer' : '';
  }

  // Restituisce gli stili inline della riga in base alla configurazione condizionale
  getRowStyle(rowData: T): any {
    const conditionalConfig = this.tableConfig().conditionalRowConfig;
    if (conditionalConfig?.ngStyle) {
      return conditionalConfig.ngStyle(rowData);
    }
    return {};
  }

  // Restituisce la classe CSS per le righe espanse (tabella figlia)
  getExpandedRowClass(rowData: T | E): string {
    const conditionalConfig = this.tableConfig().expandableRowsConfig?.conditionalRowConfig;
    if (conditionalConfig?.ngClass) {
      const fn = conditionalConfig.ngClass as (data: any) => string;
      return fn(rowData);
    }
    return '';
  }

  // Restituisce gli stili inline per le righe espanse (tabella figlia)
  getExpandedRowStyle(rowData: T | E): { [klass: string]: any } {
    const conditionalConfig = this.tableConfig().expandableRowsConfig?.conditionalRowConfig;
    if (conditionalConfig?.ngStyle) {
      const fn = conditionalConfig.ngStyle as (data: any) => { [klass: string]: any };
      return fn(rowData);
    }
    return {};
  }
}
