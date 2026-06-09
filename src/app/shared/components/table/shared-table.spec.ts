import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedTable } from './shared-table';
import { ConfirmationService } from 'primeng/api';
import { Router } from '@angular/router';
import { TableConfigModel } from './models/table-config.model';
import { ActionTypeEnum } from './models/enums/action-type.enum';
import { ActionViewEnum } from './models/enums/action-view.enum';
import { ExpandableRowModeEnum } from './models/enums/expandable-row-mode.enum';
import { SortOrderEnum } from '../../../core/models/page-options.model';

interface TestEntity {
  id: number;
  name: string;
  description?: string;
  nested?: {
    value: string;
  };
}

describe('SharedTable', () => {
  let component: SharedTable<number, TestEntity>;
  let fixture: ComponentFixture<SharedTable<number, TestEntity>>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockConfirmationService: jasmine.SpyObj<ConfirmationService>;

  const basicConfig: TableConfigModel<TestEntity, never> = {
    id: 'test-table',
    tableTitle: 'Test Table',
    entities: [],
    columnsConfig: [
      { property: 'id', customLabel: 'ID' },
      { property: 'name', customLabel: 'Name' },
    ],
  };

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl']);
    mockConfirmationService = jasmine.createSpyObj('ConfirmationService', ['confirm']);

    await TestBed.configureTestingModule({
      imports: [SharedTable],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ConfirmationService, useValue: mockConfirmationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SharedTable<number, TestEntity>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('tableConfig', basicConfig);
    fixture.detectChanges();
  });

  describe('Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty data', () => {
      expect(component.data()).toEqual([]);
      expect(component.rawData()).toEqual([]);
    });

    it('should compute hasPagination correctly', () => {
      expect(component.hasPagination()).toBe(false);

      const configWithPagination: TableConfigModel<TestEntity, never> = {
        ...basicConfig,
        paginationConfig: {
          rows: 10,
          rowsPerPageOptions: [10, 20, 30],
        },
      };

      fixture.componentRef.setInput('tableConfig', configWithPagination);
      fixture.detectChanges();

      expect(component.hasPagination()).toBe(true);
    });

    it('should compute hasActions correctly', () => {
      expect(component.hasActions()).toBe(false);

      const configWithActions: TableConfigModel<TestEntity, never> = {
        ...basicConfig,
        actionsConfig: {
          actions: [],
          actionView: ActionViewEnum.IconButtons,
        },
      };

      fixture.componentRef.setInput('tableConfig', configWithActions);
      fixture.detectChanges();

      expect(component.hasActions()).toBe(true);
    });

    it('should compute hasFilter correctly', () => {
      expect(component.hasFilter()).toBe(false);

      const configWithFilter: TableConfigModel<TestEntity, never> = {
        ...basicConfig,
        tableFilter: true,
      };

      fixture.componentRef.setInput('tableConfig', configWithFilter);
      fixture.detectChanges();

      expect(component.hasFilter()).toBe(true);
    });
  });

  describe('Data Management', () => {
    it('should update data when entities change', () => {
      const entities: TestEntity[] = [
        { id: 1, name: 'Test 1' },
        { id: 2, name: 'Test 2' },
      ];

      const config: TableConfigModel<TestEntity, never> = {
        ...basicConfig,
        entities,
      };

      fixture.componentRef.setInput('tableConfig', config);
      fixture.detectChanges();

      expect(component.rawData().length).toBe(2);
      expect(component.data().length).toBe(2);
    });

    it('should apply local filters', () => {
      const entities: TestEntity[] = [
        { id: 1, name: 'Apple' },
        { id: 2, name: 'Banana' },
        { id: 3, name: 'Cherry' },
      ];

      const config: TableConfigModel<TestEntity, never> = {
        ...basicConfig,
        entities,
        tableFilter: true,
      };

      fixture.componentRef.setInput('tableConfig', config);
      fixture.detectChanges();

      component.filterInput.set('ban');
      fixture.detectChanges();

      expect(component.data().length).toBe(1);
      expect(component.data()[0].name).toBe('Banana');
    });

    it('should filter by multiple tokens', () => {
      const entities: TestEntity[] = [
        { id: 1, name: 'Apple Pie' },
        { id: 2, name: 'Banana Split' },
        { id: 3, name: 'Apple Juice' },
      ];

      const config: TableConfigModel<TestEntity, never> = {
        ...basicConfig,
        entities,
        tableFilter: true,
      };

      fixture.componentRef.setInput('tableConfig', config);
      fixture.detectChanges();

      component.filterInput.set('apple juice');
      fixture.detectChanges();

      expect(component.data().length).toBe(1);
      expect(component.data()[0].name).toBe('Apple Juice');
    });

    it('should search nested properties', () => {
      const entities: TestEntity[] = [
        { id: 1, name: 'Test 1', nested: { value: 'foo' } },
        { id: 2, name: 'Test 2', nested: { value: 'bar' } },
      ];

      const config: TableConfigModel<TestEntity, never> = {
        ...basicConfig,
        entities,
        tableFilter: true,
      };

      fixture.componentRef.setInput('tableConfig', config);
      fixture.detectChanges();

      component.filterInput.set('foo');
      fixture.detectChanges();

      expect(component.data().length).toBe(1);
      expect(component.data()[0].id).toBe(1);
    });
  });

  describe('Pagination', () => {
    it('should calculate totalRecords for local pagination', () => {
      const entities: TestEntity[] = [
        { id: 1, name: 'Test 1' },
        { id: 2, name: 'Test 2' },
        { id: 3, name: 'Test 3' },
      ];

      const config: TableConfigModel<TestEntity, never> = {
        ...basicConfig,
        entities,
        paginationConfig: {
          rows: 10,
          rowsPerPageOptions: [10, 20, 30],
        },
      };

      fixture.componentRef.setInput('tableConfig', config);
      fixture.detectChanges();

      expect(component.totalRecords()).toBe(3);
    });

    it('should calculate totalRecords for backend pagination', () => {
      const config: TableConfigModel<TestEntity, never> = {
        ...basicConfig,
        entities: [],
        paginationConfig: {
          rows: 10,
          rowsPerPageOptions: [10, 20, 30],
          backendConfig: {
            pageOptions: {
              currentPage: 1,
              pageSize: 10,
              totalResults: 100,
              totalPages: 10,
            },
            pageChange: jasmine.createSpy('pageChange'),
          },
        },
      };

      fixture.componentRef.setInput('tableConfig', config);
      fixture.detectChanges();

      expect(component.totalRecords()).toBe(100);
    });

    it('should handle page change for local pagination', () => {
      component.onPageChange({ first: 10, rows: 10 });

      expect(component.first()).toBe(10);
      expect(component.rows()).toBe(10);
    });

    it('should handle page change for backend pagination', () => {
      const pageChangeSpy = jasmine.createSpy('pageChange');
      const config: TableConfigModel<TestEntity, never> = {
        ...basicConfig,
        entities: [],
        paginationConfig: {
          rows: 10,
          rowsPerPageOptions: [10, 20, 30],
          backendConfig: {
            pageOptions: {
              currentPage: 1,
              pageSize: 10,
              totalResults: 100,
              totalPages: 10,
            },
            pageChange: pageChangeSpy,
          },
        },
      };

      fixture.componentRef.setInput('tableConfig', config);
      fixture.detectChanges();

      component.onPageChange({ first: 10, rows: 10 });

      expect(pageChangeSpy).toHaveBeenCalledWith({ page: 2, pageSize: 10 });
    });
  });

  describe('Actions', () => {
    it('should execute function action', () => {
      const mockFn = jasmine.createSpy('actionFn');
      const action = {
        label: 'Test Action',
        icon: 'pi pi-test',
        actionType: ActionTypeEnum.Fn,
        fn: mockFn,
        disabled: false,
      };

      const rowData: TestEntity = { id: 1, name: 'Test' };
      component.executeAction(action, rowData);

      expect(mockFn).toHaveBeenCalledWith(rowData);
    });

    it('should not execute disabled action', () => {
      const mockFn = jasmine.createSpy('actionFn');
      const action = {
        label: 'Test Action',
        icon: 'pi pi-test',
        actionType: ActionTypeEnum.Fn,
        fn: mockFn,
        disabled: true,
      };

      component.executeAction(action);

      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should execute route action', () => {
      const action = {
        label: 'Test Action',
        icon: 'pi pi-test',
        actionType: ActionTypeEnum.Route,
        url: '/test-route',
        disabled: false,
      };

      component.executeAction(action);

      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/test-route');
    });

    it('should execute external action', () => {
      spyOn(window, 'open');

      const action = {
        label: 'Test Action',
        icon: 'pi pi-test',
        actionType: ActionTypeEnum.External,
        url: 'https://example.com',
        disabled: false,
      };

      component.executeAction(action);

      expect(window.open).toHaveBeenCalledWith('https://example.com', '_blank');
    });

    it('should show confirmation dialog before action', () => {
      const mockFn = jasmine.createSpy('actionFn');
      const action = {
        label: 'Delete',
        icon: 'pi pi-trash',
        actionType: ActionTypeEnum.Fn,
        fn: mockFn,
        disabled: false,
        confirmDialogConfig: {
          message: 'Are you sure?',
          header: 'Confirm',
          icon: 'pi pi-exclamation-triangle',
        },
      };

      component.executeAction(action);

      expect(mockConfirmationService.confirm).toHaveBeenCalledWith(
        jasmine.objectContaining({
          message: 'Are you sure?',
          header: 'Confirm',
        })
      );
    });

    it('should handle action click event', () => {
      const mockFn = jasmine.createSpy('actionFn');
      const action = {
        label: 'Test Action',
        icon: 'pi pi-test',
        actionType: ActionTypeEnum.Fn,
        fn: mockFn,
        disabled: false,
      };

      const rowData: TestEntity = { id: 1, name: 'Test' };
      component.onActionClick({ action, rowData });

      expect(mockFn).toHaveBeenCalledWith(rowData);
    });
  });

  describe('Expandable Rows', () => {
    it('should detect expandable rows configuration', () => {
      const config: TableConfigModel<TestEntity, TestEntity> = {
        ...basicConfig,
        expandableRowsConfig: {
          mode: ExpandableRowModeEnum.Inline,
          tableTitle: 'Expanded',
          columnsConfig: [],
        },
      };

      fixture.componentRef.setInput('tableConfig', config);
      fixture.detectChanges();

      expect(component.hasExpandableRows()).toBe(true);
    });

    it('should get inline expanded row data', () => {
      const config: TableConfigModel<TestEntity, TestEntity> = {
        ...basicConfig,
        expandableRowsConfig: {
          mode: ExpandableRowModeEnum.Inline,
          tableTitle: 'Expanded',
          columnsConfig: [],
        },
      };

      fixture.componentRef.setInput('tableConfig', config);
      fixture.detectChanges();

      const rowData: TestEntity = { id: 1, name: 'Test' };
      const expandedData = component.getInlineExpandedRowData(rowData);

      expect(expandedData).toEqual([rowData]);
    });

    it('should get expanded table title as string', () => {
      const config: TableConfigModel<TestEntity, TestEntity> = {
        ...basicConfig,
        expandableRowsConfig: {
          mode: ExpandableRowModeEnum.Inline,
          tableTitle: 'Static Title',
          columnsConfig: [],
        },
      };

      fixture.componentRef.setInput('tableConfig', config);
      fixture.detectChanges();

      const rowData: TestEntity = { id: 1, name: 'Test' };
      const title = component.getExpandedTableTitle(rowData);

      expect(title).toBe('Static Title');
    });

    it('should get expanded table title as function', () => {
      const config: TableConfigModel<TestEntity, TestEntity> = {
        ...basicConfig,
        expandableRowsConfig: {
          mode: ExpandableRowModeEnum.Inline,
          tableTitle: (data: TestEntity[]) => `Items: ${data.length}`,
          columnsConfig: [],
        },
      };

      fixture.componentRef.setInput('tableConfig', config);
      fixture.detectChanges();

      const rowData: TestEntity = { id: 1, name: 'Test' };
      const title = component.getExpandedTableTitle(rowData);

      expect(title).toBe('Items: 1');
    });
  });

  describe('Sorting', () => {
    it('should detect sortable columns', () => {
      const config: TableConfigModel<TestEntity, never> = {
        ...basicConfig,
        tableSortable: true,
        columnsConfig: [
          { property: 'id', sortableColumn: true },
          { property: 'name', sortableColumn: false },
        ],
      };

      fixture.componentRef.setInput('tableConfig', config);
      fixture.detectChanges();

      expect(component.isColumnSortable(config.columnsConfig[0])).toBe(true);
      expect(component.isColumnSortable(config.columnsConfig[1])).toBe(false);
    });

    it('should handle backend sort', () => {
      const pageChangeSpy = jasmine.createSpy('pageChange');
      const config: TableConfigModel<TestEntity, never> = {
        ...basicConfig,
        tableSortable: true,
        paginationConfig: {
          rows: 10,
          rowsPerPageOptions: [10, 20, 30],
          backendConfig: {
            pageOptions: {
              currentPage: 1,
              pageSize: 10,
              totalResults: 100,
              totalPages: 10,
            },
            pageChange: pageChangeSpy,
          },
        },
      };

      fixture.componentRef.setInput('tableConfig', config);
      fixture.detectChanges();

      component.onBackendSort({ field: 'name', order: 1 } as any);

      expect(pageChangeSpy).toHaveBeenCalledWith(
        jasmine.objectContaining({
          sortField: 'name',
          sortOrder: SortOrderEnum.Asc,
        })
      );
    });
  });

  describe('Selection', () => {
    it('should handle entity selection', () => {
      const entities: TestEntity[] = [
        { id: 1, name: 'Test 1' },
        { id: 2, name: 'Test 2' },
      ];

      component.selectedEntities.set(entities);

      expect(component.selectedEntities().length).toBe(2);
    });
  });

  describe('Add Record', () => {
    it('should detect add record configuration', () => {
      const config: TableConfigModel<TestEntity, never> = {
        ...basicConfig,
        addRecordConfig: {
          label: 'Add',
          actionType: ActionTypeEnum.Fn,
          fn: jasmine.createSpy('addFn'),
        },
      };

      fixture.componentRef.setInput('tableConfig', config);
      fixture.detectChanges();

      expect(component.hasAddRecordFn()).toBe(true);
    });

    it('should execute add record function', () => {
      const mockFn = jasmine.createSpy('addFn');
      const config: TableConfigModel<TestEntity, never> = {
        ...basicConfig,
        addRecordConfig: {
          label: 'Add',
          actionType: ActionTypeEnum.Fn,
          fn: mockFn,
        },
      };

      fixture.componentRef.setInput('tableConfig', config);
      fixture.detectChanges();

      component.addRecordHandler(component.tableConfig().addRecordConfig);

      expect(mockFn).toHaveBeenCalled();
    });

    it('should execute add record route action', () => {
      const config: TableConfigModel<TestEntity, never> = {
        ...basicConfig,
        addRecordConfig: {
          label: 'Add',
          actionType: ActionTypeEnum.Route,
          url: '/add',
        },
      };

      fixture.componentRef.setInput('tableConfig', config);
      fixture.detectChanges();

      component.addRecordHandler(component.tableConfig().addRecordConfig);

      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/add');
    });
  });

  describe('Export', () => {
    it('should detect export configuration', () => {
      const config: TableConfigModel<TestEntity, never> = {
        ...basicConfig,
        exportConfig: {
          label: 'Export',
          fn: jasmine.createSpy('exportFn'),
        },
      };

      fixture.componentRef.setInput('tableConfig', config);
      fixture.detectChanges();

      expect(component.hasExportDataFn()).toBe(true);
    });

    it('should execute export function', () => {
      const mockFn = jasmine.createSpy('exportFn');
      const config: TableConfigModel<TestEntity, never> = {
        ...basicConfig,
        exportConfig: {
          label: 'Export',
          fn: mockFn,
        },
      };

      fixture.componentRef.setInput('tableConfig', config);
      fixture.detectChanges();

      component.exportDataHandler(component.tableConfig().exportConfig);

      expect(mockFn).toHaveBeenCalled();
    });

    it('should execute export with selected entities', () => {
      const mockFn = jasmine.createSpy('exportFn');
      const config: TableConfigModel<TestEntity, never> = {
        ...basicConfig,
        exportConfig: {
          label: 'Export',
          fn: mockFn,
          fromCheckboxSelection: true,
        },
      };

      fixture.componentRef.setInput('tableConfig', config);
      fixture.detectChanges();

      component.selectedEntities.set([
        { id: 1, name: 'Test 1' },
        { id: 2, name: 'Test 2' },
      ]);

      component.exportDataHandler(component.tableConfig().exportConfig);

      expect(mockFn).toHaveBeenCalledWith([1, 2]);
    });
  });

  describe('Conditional Row Styling', () => {
    it('should apply conditional row class', () => {
      const config: TableConfigModel<TestEntity, never> = {
        ...basicConfig,
        conditionalRowConfig: {
          ngClass: (data: TestEntity | undefined) => (data?.id === 1 ? 'highlight' : ''),
        },
      };

      fixture.componentRef.setInput('tableConfig', config);
      fixture.detectChanges();

      const rowData1: TestEntity = { id: 1, name: 'Test 1' };
      const rowData2: TestEntity = { id: 2, name: 'Test 2' };

      expect(component.getRowClass(rowData1)).toBe('highlight');
      expect(component.getRowClass(rowData2)).toBe('');
    });

    it('should apply conditional row style', () => {
      const config: TableConfigModel<TestEntity, never> = {
        ...basicConfig,
        conditionalRowConfig: {
          ngStyle: (data: TestEntity | undefined) => (data?.id === 1 ? { color: 'red' } : {}),
        },
      };

      fixture.componentRef.setInput('tableConfig', config);
      fixture.detectChanges();

      const rowData1: TestEntity = { id: 1, name: 'Test 1' };
      const rowData2: TestEntity = { id: 2, name: 'Test 2' };

      expect(component.getRowStyle(rowData1)).toEqual({ color: 'red' });
      expect(component.getRowStyle(rowData2)).toEqual({});
    });
  });

  describe('Column Labels', () => {
    it('should get column label from property', () => {
      const column = { property: 'name' as keyof TestEntity };
      expect(component.getColumnLabel(column)).toBe('name');
    });

    it('should get column label from custom label string', () => {
      const column = { property: 'name' as keyof TestEntity, customLabel: 'Name' };
      expect(component.getColumnLabel(column)).toBe('Name');
    });

    it('should get column label from custom label function', () => {
      const column = {
        property: 'name' as keyof TestEntity,
        customLabel: (data: TestEntity[]) => `Names (${data.length})`,
      };

      const config: TableConfigModel<TestEntity, never> = {
        ...basicConfig,
        entities: [
          { id: 1, name: 'Test 1' },
          { id: 2, name: 'Test 2' },
        ],
      };

      fixture.componentRef.setInput('tableConfig', config);
      fixture.detectChanges();

      expect(component.getColumnLabel(column)).toBe('Names (2)');
    });
  });

  describe('Display Computed Properties', () => {
    it('should display table title as string', () => {
      expect(component.displayTableTitle()).toBe('Test Table');
    });

    it('should display table title as function', () => {
      const config: TableConfigModel<TestEntity, never> = {
        ...basicConfig,
        tableTitle: (data: TestEntity[]) => `Items: ${data.length}`,
        entities: [{ id: 1, name: 'Test 1' }],
      };

      fixture.componentRef.setInput('tableConfig', config);
      fixture.detectChanges();

      expect(component.displayTableTitle()).toBe('Items: 1');
    });

    it('should display table subtitle', () => {
      const config: TableConfigModel<TestEntity, never> = {
        ...basicConfig,
        tableSubtitle: 'Subtitle',
      };

      fixture.componentRef.setInput('tableConfig', config);
      fixture.detectChanges();

      expect(component.displayTableSubtitle()).toBe('Subtitle');
    });
  });
});
