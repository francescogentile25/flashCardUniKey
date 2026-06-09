import { Component, inject, input } from '@angular/core';
import { CheckboxConfigModel, ColumnsConfigModel, SwitchConfigModel } from "../../models/columns-config.model";
import { AsBoolPipe } from "../../../../pipes/as-bool-pipe";
import { AsyncPipe, CurrencyPipe } from "@angular/common";
import { Checkbox } from "primeng/checkbox";
import { FnPipe } from "../../../../pipes/fn.pipe";
import { SafeHtmlPipe } from "../../../../pipes/safe-html-pipe";
import { Tag } from "primeng/tag";
import { ToggleSwitch } from "primeng/toggleswitch";
import moment from "moment/moment";
import { IconLabelStyleEnum } from "../../models/enums/icon-label-style.enum";
import { ColumnTypeEnum } from "../../models/enums/column-type.enum";
import { FormsModule } from "@angular/forms";
import { ConfirmationService } from "primeng/api";
import { SeverityEnum } from "../../../../../core/utils/primeng.util";
import { Tooltip } from "primeng/tooltip";
import { ResolveStringOrFnPipe } from "../../../../pipes/resolve-string-or-fn-pipe";

@Component({
  selector: 'app-table-cell',
  imports: [
    AsBoolPipe,
    AsyncPipe,
    Checkbox,
    CurrencyPipe,
    FnPipe,
    SafeHtmlPipe,
    Tag,
    ToggleSwitch,
    FormsModule,
    Tooltip,
    ResolveStringOrFnPipe
  ],
  templateUrl: './table-cell.html',
  styleUrl: './table-cell.scss',
})
export class TableCell<IdType extends string | number, T extends { id: IdType }> {
  // Servizio di conferma PrimeNG per le dialog di conferma
  confirmationService = inject(ConfirmationService);

  // Configurazione della colonna a cui appartiene la cella
  column = input.required<ColumnsConfigModel<T>>();

  // Dati della riga corrente
  rowData = input.required<T>();

  // Indice della riga (utile per id unici di input/label)
  rowIndex = input.required<number>();

  // Espone moment nel template per formattare date
  protected readonly moment = moment;

  // Espone l’enum IconLabelStyleEnum nel template
  protected readonly IconLabelStyleEnum = IconLabelStyleEnum;

  // Espone l’enum ColumnTypeEnum nel template
  protected readonly ColumnTypeEnum = ColumnTypeEnum;

  // Verifica se la colonna ha una configurazione customValue
  hasCustomValue(column: ColumnsConfigModel<T>): boolean {
    return !!column.customValue;
  }

  // Restituisce il valore della proprietà (anche annidata) per la cella,
  // applicando eventualmente il troncamento di testo
  getValue(column: ColumnsConfigModel<T>, rowData: T): any {
    const value = this.getNestedProperty(rowData, column.property as string);

    if (column.truncateMaxCharacters && typeof value === 'string') {
      return value.length > column.truncateMaxCharacters
        ? value.substring(0, column.truncateMaxCharacters) + '...'
        : value;
    }

    return value;
  }

  // Recupera il valore di una proprietà annidata data una path "a.b.c"
  getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  // Gestisce la conferma (eventuale) prima di eseguire la checkboxFn
  checkCheckboxConfirmDialog(config?: CheckboxConfigModel<T>, data?: T) {
    // Se non c'è configurazione esce
    if (!config) {
      return;
    }
    // Se non è stata definita la funzione associata esce
    if (!config.fn) {
      console.warn('La funzione per questo switch non è stata definita');
      return;
    }
    // Se è configurata una dialog di conferma la mostra
    if (!!config.confirmDialogConfig) {
      const action = config.confirmDialogConfig;
      this.confirmationService.confirm({
        message: action.message,
        header: action.header || 'Conferma',
        icon: action.icon || 'pi pi-exclamation-triangle',
        acceptLabel: action.acceptLabel || 'Conferma',
        rejectLabel: action.rejectLabel || 'Annulla',
        acceptButtonProps: action.acceptButtonProps,
        rejectButtonProps: action.rejectButtonProps || { variant: 'text', severity: SeverityEnum.Secondary },
        acceptButtonStyleClass: action.acceptButtonStyleClass,
        rejectButtonStyleClass: action.rejectButtonStyleClass,
        accept: () => config.fn!(data)
      });
    }
    // Altrimenti esegue direttamente la funzione associata alla checkbox
    else {
      config.fn!(data);
    }
  }

  // Gestisce la conferma (eventuale) prima di eseguire la switchFn
  checkSwitchConfirmDialog(config?: SwitchConfigModel<T>, data?: T) {
    // Se non c'è configurazione esce
    if (!config) {
      return;
    }
    // Se non è stata definita la funzione associata esce
    if (!config.fn) {
      console.warn('La funzione per questo switch non è stata definita');
      return;
    }
    // Se è configurata una dialog di conferma la mostra
    if (!!config.confirmDialogConfig) {
      const action = config.confirmDialogConfig;
      this.confirmationService.confirm({
        message: action.message,
        header: action.header || 'Conferma',
        icon: action.icon || 'pi pi-exclamation-triangle',
        acceptLabel: action.acceptLabel || 'Conferma',
        rejectLabel: action.rejectLabel || 'Annulla',
        acceptButtonProps: action.acceptButtonProps,
        rejectButtonProps: action.rejectButtonProps || { variant: 'text', severity: SeverityEnum.Secondary },
        acceptButtonStyleClass: action.acceptButtonStyleClass,
        rejectButtonStyleClass: action.rejectButtonStyleClass,
        accept: () => config.fn!(data)
      });
    }
    // Altrimenti esegue direttamente la funzione associata al switch
    else {
      config.fn!(data);
    }
  }
}
