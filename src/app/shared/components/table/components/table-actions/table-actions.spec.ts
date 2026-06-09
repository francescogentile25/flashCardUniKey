import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TableActions } from './table-actions';
import { ActionConfigModel } from '../../models/actions-config.model';
import { ActionTypeEnum } from '../../models/enums/action-type.enum';
import { ActionViewEnum } from '../../models/enums/action-view.enum';
import { SeverityEnum } from '../../../../../core/utils/primeng.util';
import { ResolveStringOrFnPipe } from '../../../../pipes/resolve-string-or-fn-pipe';

interface TestEntity {
  id: number;
  name: string;
  isActive: boolean;
}

describe('TableActions', () => {
  let component: TableActions<number, TestEntity>;
  let fixture: ComponentFixture<TableActions<number, TestEntity>>;

  const mockEntity: TestEntity = {
    id: 1,
    name: 'Test Entity',
    isActive: true
  };

  const mockActions: ActionConfigModel<TestEntity>[] = [
    {
      label: 'Edit',
      icon: 'pi pi-pencil',
      actionType: ActionTypeEnum.Fn,
      primaryAction: true,
      fn: (data) => console.log('Edit', data)
    },
    {
      label: 'Delete',
      icon: 'pi pi-trash',
      actionType: ActionTypeEnum.Fn,
      severity: SeverityEnum.Danger,
      fn: (data) => console.log('Delete', data)
    },
    {
      label: 'View',
      icon: 'pi pi-eye',
      actionType: ActionTypeEnum.Fn,
      fn: (data) => console.log('View', data)
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableActions],
      providers: [ResolveStringOrFnPipe]
    }).compileComponents();

    fixture = TestBed.createComponent(TableActions<number, TestEntity>);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('visibleActions', () => {
    it('should return all actions when no visibleFn is provided', () => {
      fixture.componentRef.setInput('actions', mockActions);
      fixture.detectChanges();

      const visible = component.visibleActions();
      expect(visible.length).toBe(3);
    });

    it('should filter actions based on visibleFn', () => {
      const actionsWithVisibility: ActionConfigModel<TestEntity>[] = [
        {
          ...mockActions[0],
          visibleFn: (data) => data?.isActive ?? false
        },
        {
          ...mockActions[1],
          visibleFn: (data) => !(data?.isActive ?? true)
        },
        mockActions[2]
      ];

      fixture.componentRef.setInput('actions', actionsWithVisibility);
      fixture.componentRef.setInput('rowData', mockEntity);
      fixture.detectChanges();

      const visible = component.visibleActions();
      expect(visible.length).toBe(2); // Edit (isActive=true) and View
      expect(visible[0].label).toBe('Edit');
      expect(visible[1].label).toBe('View');
    });

    it('should handle undefined rowData', () => {
      const actionsWithVisibility: ActionConfigModel<TestEntity>[] = [
        {
          ...mockActions[0],
          visibleFn: (data) => data?.isActive ?? false
        }
      ];

      fixture.componentRef.setInput('actions', actionsWithVisibility);
      fixture.detectChanges();

      const visible = component.visibleActions();
      expect(visible.length).toBe(0);
    });
  });

  describe('inlineActions', () => {
    it('should return first maxInlineActions actions', () => {
      fixture.componentRef.setInput('actions', mockActions);
      fixture.componentRef.setInput('maxInlineActions', 2);
      fixture.detectChanges();

      const inline = component.inlineActions();
      expect(inline.length).toBe(2);
      expect(inline[0].label).toBe('Edit');
      expect(inline[1].label).toBe('Delete');
    });

    it('should return all actions if maxInlineActions is greater than actions length', () => {
      fixture.componentRef.setInput('actions', mockActions);
      fixture.componentRef.setInput('maxInlineActions', 10);
      fixture.detectChanges();

      const inline = component.inlineActions();
      expect(inline.length).toBe(3);
    });

    it('should return empty array if maxInlineActions is 0', () => {
      fixture.componentRef.setInput('actions', mockActions);
      fixture.componentRef.setInput('maxInlineActions', 0);
      fixture.detectChanges();

      const inline = component.inlineActions();
      expect(inline.length).toBe(0);
    });
  });

  describe('overflowActions', () => {
    it('should return actions beyond maxInlineActions', () => {
      fixture.componentRef.setInput('actions', mockActions);
      fixture.componentRef.setInput('maxInlineActions', 2);
      fixture.detectChanges();

      const overflow = component.overflowActions();
      expect(overflow.length).toBe(1);
      expect(overflow[0].label).toBe('View');
    });

    it('should return empty array if all actions fit inline', () => {
      fixture.componentRef.setInput('actions', mockActions);
      fixture.componentRef.setInput('maxInlineActions', 5);
      fixture.detectChanges();

      const overflow = component.overflowActions();
      expect(overflow.length).toBe(0);
    });

    it('should return all actions if maxInlineActions is 0', () => {
      fixture.componentRef.setInput('actions', mockActions);
      fixture.componentRef.setInput('maxInlineActions', 0);
      fixture.detectChanges();

      const overflow = component.overflowActions();
      expect(overflow.length).toBe(3);
    });
  });

  describe('primaryAction', () => {
    it('should return action marked as primary', () => {
      fixture.componentRef.setInput('actions', mockActions);
      fixture.detectChanges();

      const primary = component.primaryAction();
      expect(primary).toBeDefined();
      expect(primary?.label).toBe('Edit');
      expect(primary?.primaryAction).toBe(true);
    });

    it('should return first action if no primary action is marked', () => {
      const actionsWithoutPrimary = mockActions.map(a => ({ ...a, primaryAction: false }));
      fixture.componentRef.setInput('actions', actionsWithoutPrimary);
      fixture.detectChanges();

      const primary = component.primaryAction();
      expect(primary).toBeDefined();
      expect(primary?.label).toBe('Edit');
    });

    it('should return first visible action when others are hidden', () => {
      const actionsWithVisibility: ActionConfigModel<TestEntity>[] = [
        {
          ...mockActions[0],
          primaryAction: true,
          visibleFn: (data) => false
        },
        {
          ...mockActions[1]
        }
      ];

      fixture.componentRef.setInput('actions', actionsWithVisibility);
      fixture.detectChanges();

      const primary = component.primaryAction();
      expect(primary).toBeDefined();
      expect(primary?.label).toBe('Delete');
    });
  });

  describe('menuItems', () => {
    it('should convert actions to menu items', () => {
      fixture.componentRef.setInput('actions', mockActions);
      fixture.componentRef.setInput('rowData', mockEntity);
      fixture.detectChanges();

      const menuItems = component.menuItems();
      expect(menuItems.length).toBe(3);
      expect(menuItems[0].label).toBe('Edit');
      expect(menuItems[0].icon).toBe('pi pi-pencil');
      expect(menuItems[1].label).toBe('Delete');
      expect(menuItems[2].label).toBe('View');
    });

    it('should handle disabled actions', () => {
      const actionsWithDisabled = [
        { ...mockActions[0], disabled: true },
        mockActions[1]
      ];

      fixture.componentRef.setInput('actions', actionsWithDisabled);
      fixture.detectChanges();

      const menuItems = component.menuItems();
      expect(menuItems[0].disabled).toBe(true);
      expect(menuItems[1].disabled).toBeFalsy();
    });

    it('should handle separator actions', () => {
      const actionsWithSeparator = [
        mockActions[0],
        { ...mockActions[1], separator: true }
      ];

      fixture.componentRef.setInput('actions', actionsWithSeparator);
      fixture.detectChanges();

      const menuItems = component.menuItems();
      expect(menuItems[1].separator).toBe(true);
    });

    it('should filter menu items based on visibility', () => {
      const actionsWithVisibility: ActionConfigModel<TestEntity>[] = [
        {
          ...mockActions[0],
          visibleFn: (data) => data?.isActive ?? false
        },
        {
          ...mockActions[1],
          visibleFn: (data) => !(data?.isActive ?? true)
        }
      ];

      fixture.componentRef.setInput('actions', actionsWithVisibility);
      fixture.componentRef.setInput('rowData', mockEntity);
      fixture.detectChanges();

      const menuItems = component.menuItems();
      expect(menuItems.length).toBe(1);
      expect(menuItems[0].label).toBe('Edit');
    });
  });

  describe('action click events', () => {
    it('should emit actionClick when action is clicked', (done) => {
      fixture.componentRef.setInput('actions', mockActions);
      fixture.componentRef.setInput('rowData', mockEntity);
      fixture.detectChanges();

      component.actionClick.subscribe(event => {
        expect(event.action).toBe(mockActions[0]);
        expect(event.rowData).toBe(mockEntity);
        done();
      });

      component.onActionClick(mockActions[0]);
    });

    it('should handle click without rowData', (done) => {
      fixture.componentRef.setInput('actions', mockActions);
      fixture.detectChanges();

      component.actionClick.subscribe(event => {
        expect(event.action).toBe(mockActions[0]);
        expect(event.rowData).toBeUndefined();
        done();
      });

      component.onActionClick(mockActions[0]);
    });
  });

  describe('action view modes', () => {
    it('should default to IconButtons view', () => {
      fixture.componentRef.setInput('actions', mockActions);
      fixture.detectChanges();

      expect(component.actionsView()).toBe(ActionViewEnum.IconButtons);
    });

    it('should accept Menu view', () => {
      fixture.componentRef.setInput('actions', mockActions);
      fixture.componentRef.setInput('actionsView', ActionViewEnum.Menu);
      fixture.detectChanges();

      expect(component.actionsView()).toBe(ActionViewEnum.Menu);
    });

    it('should accept Hybrid view', () => {
      fixture.componentRef.setInput('actions', mockActions);
      fixture.componentRef.setInput('actionsView', ActionViewEnum.Hybrid);
      fixture.detectChanges();

      expect(component.actionsView()).toBe(ActionViewEnum.Hybrid);
    });

    it('should accept Split view', () => {
      fixture.componentRef.setInput('actions', mockActions);
      fixture.componentRef.setInput('actionsView', ActionViewEnum.Split);
      fixture.detectChanges();

      expect(component.actionsView()).toBe(ActionViewEnum.Split);
    });
  });

  describe('edge cases', () => {
    it('should handle empty actions array', () => {
      fixture.componentRef.setInput('actions', []);
      fixture.detectChanges();

      expect(component.visibleActions().length).toBe(0);
      expect(component.inlineActions().length).toBe(0);
      expect(component.overflowActions().length).toBe(0);
      expect(component.menuItems().length).toBe(0);
    });

    it('should handle actions with function-based labels', () => {
      const actionsWithFnLabel: ActionConfigModel<TestEntity>[] = [
        {
          label: (data) => `Edit ${data?.name}`,
          icon: 'pi pi-pencil',
          actionType: ActionTypeEnum.Fn,
          fn: (data) => console.log('Edit', data)
        }
      ];

      fixture.componentRef.setInput('actions', actionsWithFnLabel);
      fixture.componentRef.setInput('rowData', mockEntity);
      fixture.detectChanges();

      const menuItems = component.menuItems();
      expect(menuItems[0].label).toBe('Edit Test Entity');
    });

    it('should handle actions with function-based icons', () => {
      const actionsWithFnIcon: ActionConfigModel<TestEntity>[] = [
        {
          label: 'Action',
          icon: (data) => data?.isActive ? 'pi pi-check' : 'pi pi-times',
          actionType: ActionTypeEnum.Fn,
          fn: (data) => console.log('Action', data)
        }
      ];

      fixture.componentRef.setInput('actions', actionsWithFnIcon);
      fixture.componentRef.setInput('rowData', mockEntity);
      fixture.detectChanges();

      const menuItems = component.menuItems();
      expect(menuItems[0].icon).toBe('pi pi-check');
    });
  });
});
