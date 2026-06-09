import { Component, computed, inject, input, output } from '@angular/core';
import { ActionConfigModel } from "../../models/actions-config.model";
import { ActionViewEnum } from "../../models/enums/action-view.enum";
import { MenuItem } from "primeng/api";
import { Button } from "primeng/button";
import { Tooltip } from "primeng/tooltip";
import { Menu } from "primeng/menu";
import { SplitButton } from "primeng/splitbutton";
import { SafeHtmlPipe } from "../../../../pipes/safe-html-pipe";
import { ResolveStringOrFnPipe } from "../../../../pipes/resolve-string-or-fn-pipe";

// Evento emesso al click di una azione
export interface ActionClickEvent<T> {
  // Azione che è stata cliccata
  action: ActionConfigModel<T>;

  // Dati della riga su cui è stata eseguita l’azione
  rowData?: T;
}

@Component({
  selector: 'app-table-actions',
  imports: [
    Button,
    Tooltip,
    Menu,
    SplitButton,
    SafeHtmlPipe,
    ResolveStringOrFnPipe
  ],
  templateUrl: './table-actions.html',
  styleUrl: './table-actions.scss',
  providers: [ResolveStringOrFnPipe]
})
export class TableActions<IdType extends string | number, T extends { id: IdType }> {
  resolveStringOrFnPipe = inject(ResolveStringOrFnPipe);

  // Elenco delle azioni configurate per la riga
  actions = input.required<ActionConfigModel<T>[]>();

  // Dati della riga a cui le azioni si riferiscono
  rowData = input<T>();

  // Modalità di visualizzazione delle azioni (icone, menu, split, ecc.)
  actionsView = input<ActionViewEnum>(ActionViewEnum.IconButtons);

  // Numero massimo di azioni mostrate inline (usato in modalità Hybrid)
  maxInlineActions = input<number>(2);

  // Template HTML personalizzato per la modalità Custom
  customTemplate = input<string>();

  // Evento emesso quando viene cliccata una azione
  actionClick = output<ActionClickEvent<T>>();

  // Espone l’enum nel template
  protected readonly ActionViewEnum = ActionViewEnum;

  // Azioni visibili dopo l’applicazione della visibleFn
  visibleActions = computed(() => {
    return this.actions().filter(action => {
      if (action.visibleFn) {
        return action.visibleFn(this.rowData());
      }
      return true;
    });
  });

  // Azioni mostrate inline (prime N in base a maxInlineActions)
  inlineActions = computed(() => {
    const max = this.maxInlineActions();
    return this.visibleActions().slice(0, max);
  });

  // Azioni rimanenti che andranno nel menu di overflow (Hybrid)
  overflowActions = computed(() => {
    const max = this.maxInlineActions();
    return this.visibleActions().slice(max);
  });

  // Azione principale per la modalità Split (prima con primaryAction, altrimenti la prima visibile)
  primaryAction = computed(() => {
    const actions = this.visibleActions();
    return actions.find(a => a.primaryAction) || actions[0];
  });

  // Modello di menu per la vista Menu (tutte le azioni nel menu)
  menuItems = computed((): MenuItem[] => {
    return this.visibleActions().map(action => ({
      label: this.resolveStringOrFnPipe.transform(action.label, this.rowData()),
      icon: this.resolveStringOrFnPipe.transform(action.icon, this.rowData()),
      disabled: action.disabled,
      badge: this.getBadgeValue(action),
      badgeClass: action.badgeConfig?.severity,
      command: () => this.onActionClick(action),
      separator: action.separator,
      styleClass: action.menuItemStyleClass
    }));
  });

  // Modello di menu per le azioni secondarie nella vista Split
  secondaryMenuItems = computed((): MenuItem[] => {
    const primary = this.primaryAction();
    return this.visibleActions()
      .filter(action => action !== primary)
      .map(action => ({
        label: this.resolveStringOrFnPipe.transform(action.label, this.rowData()),
        icon: this.resolveStringOrFnPipe.transform(action.icon, this.rowData()),
        disabled: action.disabled,
        badge: this.getBadgeValue(action),
        badgeClass: action.badgeConfig?.severity,
        command: () => this.onActionClick(action),
        separator: action.separator,
        styleClass: action.menuItemStyleClass
      }));
  });

  // Modello di menu per le azioni in overflow nella vista Hybrid
  overflowMenuItems = computed((): MenuItem[] => {
    return this.overflowActions().map(action => ({
      label: this.resolveStringOrFnPipe.transform(action.label, this.rowData()),
      icon: this.resolveStringOrFnPipe.transform(action.icon, this.rowData()),
      disabled: action.disabled,
      badge: this.getBadgeValue(action),
      badgeClass: action.badgeConfig?.severity,
      command: () => this.onActionClick(action),
      separator: action.separator,
      styleClass: action.menuItemStyleClass
    }));
  });

  // Restituisce il valore del badge per una azione, se configurato
  getBadgeValue(action: ActionConfigModel<T>): string | undefined {
    if (!action.badge || !action.badgeConfig) return undefined;
    return action.badgeConfig.value(this.rowData());
  }

  // Gestisce il click su una azione ed emette l’evento verso il componente padre
  onActionClick(action: ActionConfigModel<T>): void {
    if (action.disabled) return;

    this.actionClick.emit({
      action,
      rowData: this.rowData()
    });
  }
}
