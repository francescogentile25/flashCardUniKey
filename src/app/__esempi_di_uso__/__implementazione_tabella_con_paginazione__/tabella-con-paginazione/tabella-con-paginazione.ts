import { Component } from '@angular/core';
import { EntityResponse } from "../../__implementazione_store__/models/responses/entity.response";
import moment from "moment";
import { TableConfigModel } from "../../../shared/components/table/models/table-config.model";
import { ColumnTypeEnum } from "../../../shared/components/table/models/enums/column-type.enum";
import { IconLabelStyleEnum } from "../../../shared/components/table/models/enums/icon-label-style.enum";
import { ActionViewEnum } from "../../../shared/components/table/models/enums/action-view.enum";
import { ActionTypeEnum } from "../../../shared/components/table/models/enums/action-type.enum";
import { SeverityEnum } from "../../../core/utils/primeng.util";
import { SharedTable } from "../../../shared/components/table/shared-table";

const MOCK_ARRAY_ENTITA: EntityResponse[] = [
  {
    id: 1,
    propA: 'Elemento 1',
    propB: 10,
    propC: true,
    propD: moment(new Date(2024, 0, 10)).format('YYYY-MM-DD'),
  },
  {
    id: 2,
    propA: 'Elemento 2',
    propB: 25,
    propC: false,
    propD: moment(new Date(2024, 3, 5)).format('YYYY-MM-DD'),
  },
  {
    id: 3,
    propA: 'Elemento 3',
    propB: 5,
    propC: true,
    propD: undefined,
  },
  {
    id: 4,
    propA: 'Elemento 4',
    propB: 50,
    propC: false,
    propD: moment(new Date(2024, 9, 2)).format('YYYY-MM-DD'),
  },
];

@Component({
  selector: 'app-tabella-con-paginazione',
  imports: [
    SharedTable
  ],
  templateUrl: './tabella-con-paginazione.html',
  styleUrl: './tabella-con-paginazione.scss',
})
export class TabellaConPaginazione {
  // Configurazione completa di esempio
  tableConfig: TableConfigModel<EntityResponse> = {
    id: 'tableConfig_01',

    tableTitle: 'Titolo Esempio Tabella Con Paginazione',
    tableSubtitle: 'Sottotitolo Esempio Tabella Con Paginazione',

    // Dati mostrati in tabella
    entities: [...MOCK_ARRAY_ENTITA],

    // Colonne
    columnsConfig: [
      {
        property: 'propA',
        sortableColumn: true,
        customLabel: 'Nome',
      },
      {
        property: 'propB',
        sortableColumn: true,
        customLabel: 'Valore ($)',
        customValue: {
          columnType: ColumnTypeEnum.Currency,
          currencyConfig: {
            currencyCode: 'USD',
            display: 'symbol'
          },
        },
      },
      {
        property: 'propC',
        sortableColumn: false,
        customLabel: 'Stato',
        customValue: {
          columnType: ColumnTypeEnum.Boolean,
          booleanConfig: {
            tooltip: (data) => (data?.propC ? 'Abilitato' : 'Disabilitato'),
          }
        },
      },
      {
        property: 'propD',
        sortableColumn: true,
        customLabel: 'Creata il',
        customValue: {
          columnType: ColumnTypeEnum.Date,
          dateFormat: 'DD/MM/YYYY',
        },
      },
      {
        // Colonna “di stato” con icona + label
        property: 'propC',
        sortableColumn: false,
        customLabel: 'Stato',
        customValue: {
          columnType: ColumnTypeEnum.Icon,
          iconConfig: {
            iconLabelStyle: IconLabelStyleEnum.IconAndLabel,
            icon: 'pi pi-circle-fill',
            tooltip: (data) => (data?.propC ? 'Record OK' : 'Record da verificare'),
            label: (data) => (data?.propC ? 'Record OK' : 'Record da verificare'),
            style: {
              fontSize: '0.75rem',
            },
            styleClass: 'text-xs',
          },
        },
      },
      {
        // Colonna “di stato” con checkbox
        property: 'propC',
        sortableColumn: false,
        customLabel: 'Stato',
        customValue: {
          columnType: ColumnTypeEnum.Checkbox,
          checkboxConfig: {
            value: (data) => data?.propC ?? false,
            label: (data) => data ? (data?.propC ? 'Abilitata' : 'Non Abilitata') : 'Non Abilitata',
            fn: (data) => console.log('Checkbox cliccato'),
            tooltip: (data) => (data?.propC ? 'Disabilita' : 'Abilita'),
          }
        },
      },
      {
        // Colonna “di stato” con switch
        property: 'propC',
        sortableColumn: false,
        customLabel: 'Stato',
        customValue: {
          columnType: ColumnTypeEnum.Switch,
          switchConfig: {
            value: (data) => data?.propC ?? false,
            label: (data) => data ? (data?.propC ? 'Abilitata' : 'Non Abilitata') : 'Non Abilitata',
            fn: (data) => console.log('Switch cliccato'),
            tooltip: (data) => (data?.propC ? 'Disabilita' : 'Abilita'),
            confirmDialogConfig: {
              message: 'Vuoi cambiare stato ?',
              header: 'Conferma',
              icon: 'pi pi-exclamation-triangle'
            },
          }
        },
      },
    ],

    // Azioni di riga
    actionsConfig: {
      actionView: ActionViewEnum.Hybrid,
      customColumnLabel: 'Azioni',
      maxInlineActions: 2,

      actions: [
        {
          label: 'Dettaglio',
          icon: 'pi pi-search',
          actionType: ActionTypeEnum.Fn,
          primaryAction: true,
          fn: (row) => this.onDettaglio(row as EntityResponse),
          tooltip: 'Vai al dettaglio del record',
        },
        {
          label: 'Modifica',
          icon: 'pi pi-pencil',
          actionType: ActionTypeEnum.Fn,
          fn: (row) => this.onModifica(row as EntityResponse),
          tooltip: 'Modifica record',
        },
        {
          label: 'Elimina',
          icon: 'pi pi-trash',
          actionType: ActionTypeEnum.Fn,
          fn: (row) => this.onElimina(row as EntityResponse),
          tooltip: 'Elimina record',
          severity: SeverityEnum.Danger,
        },
      ],
    },

    // Pulsante "Aggiungi record"
    addRecordConfig: {
      label: 'Aggiungi record',
      actionType: ActionTypeEnum.Fn,
      icon: 'pi pi-plus',
      size: 'small',
      rounded: true,
      tooltip: 'Crea un nuovo record di esempio',
      fn: () => this.onAggiungiRecord(),
    },

    // Config export (da selezione)
    exportConfig: {
      label: 'Esporta selezionati',
      icon: 'pi pi-file-excel',
      fromCheckboxSelection: true,
      severity: SeverityEnum.Success,
      size: 'small',
      tooltip: 'Esporta i record selezionati (mock)',
      fn: (ids?: (number | string)[]) => this.onExport(ids),
    },

    // Nessuna riga espandibile su questo componente
    expandableRowsConfig: undefined,

    // Nessuna riga frozen, per l’esempio
    frozenValues: [],

    // Paginazione frontend
    paginationConfig: {
      rows: 5,
      rowsPerPageOptions: [5, 10, 20],
    },

    // Nessuna classe/stile condizionale complesso: solo un esempio semplice
    conditionalRowConfig: {
      ngClass: (row) => !row ? '' : row.propC ? '' : 'bg-red-50', // es: evidenzia i record con propC = false
    },

    // Opzioni di visualizzazione tabella
    resizeableColumns: true,
    selectableRows: true, // necessario se vuoi usare export da selezione
    tableFilter: true, // abilita filtro globale
    tableSortable: true,
    tableSize: 'small',
  };

  // Handler di esempio
  onAggiungiRecord(): void {
    console.log('Click su Aggiungi record');
    // Qui potresti aprire una dialog o navigare su una pagina di creazione
  }

  onExport(ids?: (number | string)[]): void {
    console.log('Export richiesto per ID:', ids ?? 'tutti');
  }

  onDettaglio(row: EntityResponse): void {
    console.log('Dettaglio record', row);
  }

  onModifica(row: EntityResponse): void {
    console.log('Modifica record', row);
  }

  onElimina(row: EntityResponse): void {
    console.log('Elimina record', row);
  }

  // Se ti interessa intercettare le righe selezionate:
  onSelectionChange(selected: EntityResponse[]): void {
    console.log('Selezionati:', selected);
  }
}
