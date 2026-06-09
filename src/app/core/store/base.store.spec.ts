import { TestBed } from '@angular/core/testing';
import { signalStore } from '@ngrx/signals';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { SpinLoaderService } from '../services/spin-loader.service';
import { BaseEntity, BaseEntityService, createEntityStoreConfig } from './base.store';
import { PageOptionsModel } from '../models/page-options.model';

// Test entity type
interface TestEntity extends BaseEntity {
  id: number;
  name: string;
  description?: string;
}

// Mock service implementation
class MockTestService implements BaseEntityService<TestEntity> {
  getAll = jasmine.createSpy('getAll');
  getById = jasmine.createSpy('getById');
  add = jasmine.createSpy('add');
  addMany = jasmine.createSpy('addMany');
  edit = jasmine.createSpy('edit');
  patch = jasmine.createSpy('patch');
  delete = jasmine.createSpy('delete');
  deleteMany = jasmine.createSpy('deleteMany');
  getPage = jasmine.createSpy('getPage');
}

describe('Base Store', () => {
  let mockService: MockTestService;
  let mockMessageService: jasmine.SpyObj<MessageService>;
  let mockLoaderService: jasmine.SpyObj<SpinLoaderService>;

  beforeEach(() => {
    mockService = new MockTestService();
    mockMessageService = jasmine.createSpyObj('MessageService', ['add']);
    mockLoaderService = jasmine.createSpyObj('SpinLoaderService', ['startSpinLoader', 'stopSpinLoader']);

    TestBed.configureTestingModule({
      providers: [
        { provide: MockTestService, useValue: mockService },
        { provide: MessageService, useValue: mockMessageService },
        { provide: SpinLoaderService, useValue: mockLoaderService },
      ],
    });
  });

  describe('Store Creation', () => {
    it('should create a store with initial state', () => {
      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());

      expect(store.entities()).toEqual([]);
      expect(store.loading()).toBe(false);
      expect(store.selectedEntity()).toBeUndefined();
      expect(store.selectedEntities()).toEqual([]);
      expect(store.error()).toBeUndefined();
    });

    it('should create computed properties', () => {
      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());

      expect(store.count()).toBe(0);
      expect(store.isEmpty()).toBe(true);
      expect(store.hasSelection()).toBe(false);
    });
  });

  describe('State Management Methods', () => {
    it('should set and clear errors', () => {
      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());

      store.setError('Test error');
      expect(store.error()).toBe('Test error');

      store.clearError();
      expect(store.error()).toBeUndefined();
    });

    it('should manage single entity selection', () => {
      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());
      const entity: TestEntity = { id: 1, name: 'Test' };

      store.addOne(entity);
      store.setSelectedEntity(entity);
      expect(store.selectedEntity()).toEqual(entity);

      store.clearSelectedEntity();
      expect(store.selectedEntity()).toBeUndefined();
    });

    it('should select entity by id', () => {
      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());
      const entity: TestEntity = { id: 1, name: 'Test' };

      store.addOne(entity);
      store.selectEntityById(1);
      expect(store.selectedEntity()).toEqual(entity);
    });

    it('should manage multiple entity selection', () => {
      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());
      const entities: TestEntity[] = [
        { id: 1, name: 'Test 1' },
        { id: 2, name: 'Test 2' },
      ];

      store.addMany(entities);
      store.setSelectedEntities(entities);
      expect(store.selectedEntities()).toEqual(entities);

      store.clearSelection();
      expect(store.selectedEntities()).toEqual([]);
    });

    it('should add to selection without duplicates', () => {
      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());
      const entity: TestEntity = { id: 1, name: 'Test' };

      store.addToSelection(entity);
      expect(store.selectedEntities().length).toBe(1);

      store.addToSelection(entity);
      expect(store.selectedEntities().length).toBe(1);
    });

    it('should remove from selection', () => {
      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());
      const entities: TestEntity[] = [
        { id: 1, name: 'Test 1' },
        { id: 2, name: 'Test 2' },
      ];

      store.setSelectedEntities(entities);
      store.removeFromSelection(1);
      expect(store.selectedEntities().length).toBe(1);
      expect(store.selectedEntities()[0].id).toBe(2);
    });

    it('should toggle selection', () => {
      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());
      const entity: TestEntity = { id: 1, name: 'Test' };

      store.toggleSelection(entity);
      expect(store.selectedEntities().length).toBe(1);

      store.toggleSelection(entity);
      expect(store.selectedEntities().length).toBe(0);
    });

    it('should select all entities', () => {
      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());
      const entities: TestEntity[] = [
        { id: 1, name: 'Test 1' },
        { id: 2, name: 'Test 2' },
      ];

      store.addMany(entities);
      store.selectAll();
      expect(store.selectedEntities().length).toBe(2);
    });
  });

  describe('Entity Tracking Methods', () => {
    it('should track last created entity', () => {
      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());
      const entity: TestEntity = { id: 1, name: 'Test' };

      store.setLastCreated(entity);
      expect(store.lastCreated()).toEqual(entity);

      store.clearLastCreated();
      expect(store.lastCreated()).toBeUndefined();
    });

    it('should track last updated entity', () => {
      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());
      const entity: TestEntity = { id: 1, name: 'Test' };

      store.setLastUpdated(entity);
      expect(store.lastUpdated()).toEqual(entity);

      store.clearLastUpdated();
      expect(store.lastUpdated()).toBeUndefined();
    });

    it('should track last deleted entity', () => {
      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());

      store.setLastDeleted(1);
      expect(store.lastDeleted()).toBe(1);

      store.clearLastDeleted();
      expect(store.lastDeleted()).toBeUndefined();
    });

    it('should track last deleted response', () => {
      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());
      const response = { success: true };

      store.setLastDeletedResponse(response);
      expect(store.lastDeletedResponse()).toEqual(response);

      store.clearLastDeletedResponse();
      expect(store.lastDeletedResponse()).toBeUndefined();
    });
  });

  describe('Synchronous Entity Operations', () => {
    it('should add one entity', () => {
      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());
      const entity: TestEntity = { id: 1, name: 'Test' };

      store.addOne(entity);
      expect(store.entities().length).toBe(1);
      expect(store.count()).toBe(1);
      expect(store.isEmpty()).toBe(false);
    });

    it('should add many entities', () => {
      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());
      const entities: TestEntity[] = [
        { id: 1, name: 'Test 1' },
        { id: 2, name: 'Test 2' },
      ];

      store.addMany(entities);
      expect(store.entities().length).toBe(2);
    });

    it('should set all entities', () => {
      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());
      const entities: TestEntity[] = [
        { id: 1, name: 'Test 1' },
        { id: 2, name: 'Test 2' },
      ];

      store.setAll(entities);
      expect(store.entities().length).toBe(2);

      store.setAll([{ id: 3, name: 'Test 3' } as TestEntity]);
      expect(store.entities().length).toBe(1);
    });

    it('should update one entity', () => {
      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());
      const entity: TestEntity = { id: 1, name: 'Test' };

      store.addOne(entity);
      store.updateOne({ id: 1, name: 'Updated' } as TestEntity);
      expect((store.entityById()(1) as TestEntity)?.name).toBe('Updated');
    });

    it('should patch one entity', () => {
      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());
      const entity: TestEntity = { id: 1, name: 'Test', description: 'Desc' };

      store.addOne(entity);
      store.patchOne(1, { name: 'Patched' } as Partial<TestEntity>);
      expect((store.entityById()(1) as TestEntity)?.name).toBe('Patched');
      expect((store.entityById()(1) as TestEntity)?.description).toBe('Desc');
    });

    it('should remove one entity', () => {
      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());
      const entity: TestEntity = { id: 1, name: 'Test' };

      store.addOne(entity);
      expect(store.entities().length).toBe(1);

      store.removeOne(1);
      expect(store.entities().length).toBe(0);
    });

    it('should remove many entities', () => {
      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());
      const entities: TestEntity[] = [
        { id: 1, name: 'Test 1' },
        { id: 2, name: 'Test 2' },
        { id: 3, name: 'Test 3' },
      ];

      store.addMany(entities);
      store.removeMany([1, 2]);
      expect(store.entities().length).toBe(1);
      expect(store.entities()[0].id).toBe(3);
    });

    it('should clear all entities', () => {
      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());
      const entities: TestEntity[] = [
        { id: 1, name: 'Test 1' },
        { id: 2, name: 'Test 2' },
      ];

      store.addMany(entities);
      store.clearAll();
      expect(store.entities().length).toBe(0);
      expect(store.isEmpty()).toBe(true);
    });

    it('should upsert many entities', () => {
      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());
      const entity: TestEntity = { id: 1, name: 'Test' };

      store.addOne(entity);
      store.upsertMany([
        { id: 1, name: 'Updated' } as TestEntity,
        { id: 2, name: 'New' } as TestEntity,
      ]);

      expect(store.entities().length).toBe(2);
      expect((store.entityById()(1) as TestEntity)?.name).toBe('Updated');
    });
  });

  describe('Asynchronous Operations', () => {
    it('should fetch all entities successfully', (done: DoneFn) => {
      const entities: TestEntity[] = [
        { id: 1, name: 'Test 1' },
        { id: 2, name: 'Test 2' },
      ];
      mockService.getAll.and.returnValue(of(entities));

      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());

      store.getAll$();

      setTimeout(() => {
        expect(store.entities().length).toBe(2);
        expect(store.loading()).toBe(false);
        expect(mockLoaderService.startSpinLoader).toHaveBeenCalled();
        expect(mockLoaderService.stopSpinLoader).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should handle getAll error', (done: DoneFn) => {
      const error = new Error('Test error');
      mockService.getAll.and.returnValue(throwError(() => error));

      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());

      store.getAll$();

      setTimeout(() => {
        expect(store.loading()).toBe(false);
        expect(store.error()).toBeDefined();
        expect(mockMessageService.add).toHaveBeenCalled();
        expect(mockLoaderService.stopSpinLoader).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should fetch entity by id successfully', (done: DoneFn) => {
      const entity: TestEntity = { id: 1, name: 'Test' };
      mockService.getById.and.returnValue(of(entity));

      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());

      store.getById$(1);

      setTimeout(() => {
        expect(store.entities().length).toBe(1);
        expect(store.selectedEntity()).toEqual(entity);
        expect(store.loading()).toBe(false);
        done();
      }, 100);
    });

    it('should create entity successfully', (done: DoneFn) => {
      const entity: TestEntity = { id: 1, name: 'Test' };
      mockService.add.and.returnValue(of(entity));

      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());

      store.add$({ name: 'Test' });

      setTimeout(() => {
        expect(store.entities().length).toBe(1);
        expect(store.lastCreated()).toEqual(entity);
        expect(mockMessageService.add).toHaveBeenCalledWith(
          jasmine.objectContaining({ severity: 'success' })
        );
        done();
      }, 100);
    });

    it('should create multiple entities successfully', (done: DoneFn) => {
      const entities: TestEntity[] = [
        { id: 1, name: 'Test 1' },
        { id: 2, name: 'Test 2' },
      ];
      mockService.addMany.and.returnValue(of(entities));

      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());

      store.addMany$([{ name: 'Test 1' }, { name: 'Test 2' }]);

      setTimeout(() => {
        expect(store.entities().length).toBe(2);
        expect(mockMessageService.add).toHaveBeenCalledWith(
          jasmine.objectContaining({
            severity: 'success',
            detail: '2 elementi aggiunti con successo',
          })
        );
        done();
      }, 100);
    });

    it('should update entity successfully', (done: DoneFn) => {
      const entity: TestEntity = { id: 1, name: 'Updated' };
      mockService.edit.and.returnValue(of(entity));

      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());
      store.addOne({ id: 1, name: 'Test' } as TestEntity);

      store.edit$({ id: 1, name: 'Updated' } as TestEntity);

      setTimeout(() => {
        expect((store.entityById()(1) as TestEntity)?.name).toBe('Updated');
        expect(store.lastUpdated()).toEqual(entity);
        done();
      }, 100);
    });

    it('should patch entity successfully', (done: DoneFn) => {
      const entity: TestEntity = { id: 1, name: 'Patched' };
      mockService.patch.and.returnValue(of(entity));

      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());
      store.addOne({ id: 1, name: 'Test' } as TestEntity);

      store.patch$({ id: 1, name: 'Patched' } as Partial<TestEntity>);

      setTimeout(() => {
        expect((store.entityById()(1) as TestEntity)?.name).toBe('Patched');
        expect(store.lastUpdated()).toEqual(entity);
        done();
      }, 100);
    });

    it('should delete entity successfully', (done: DoneFn) => {
      mockService.delete.and.returnValue(of({}));

      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());
      store.addOne({ id: 1, name: 'Test' } as TestEntity);

      store.delete$(1);

      setTimeout(() => {
        expect(store.entities().length).toBe(0);
        expect(store.lastDeleted()).toBe(1);
        done();
      }, 100);
    });

    it('should delete multiple entities successfully', (done: DoneFn) => {
      mockService.deleteMany.and.returnValue(of({}));

      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());
      store.addMany([
        { id: 1, name: 'Test 1' } as TestEntity,
        { id: 2, name: 'Test 2' } as TestEntity,
      ]);

      store.deleteMany$([1, 2]);

      setTimeout(() => {
        expect(store.entities().length).toBe(0);
        done();
      }, 100);
    });

    it('should refresh entities successfully', (done: DoneFn) => {
      const entities: TestEntity[] = [
        { id: 1, name: 'Test 1' },
        { id: 2, name: 'Test 2' },
      ];
      mockService.getAll.and.returnValue(of(entities));

      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());

      store.refresh$();

      setTimeout(() => {
        expect(store.entities().length).toBe(2);
        expect(mockMessageService.add).toHaveBeenCalledWith(
          jasmine.objectContaining({ severity: 'info' })
        );
        done();
      }, 100);
    });

    it('should load page successfully', (done: DoneFn) => {
      const pageResult: PageOptionsModel<TestEntity> = {
        results: [
          { id: 1, name: 'Test 1' },
          { id: 2, name: 'Test 2' },
        ],
        currentPage: 1,
        pageSize: 10,
        totalResults: 2,
        totalPages: 1,
      };
      mockService.getPage.and.returnValue(of(pageResult));

      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
          useBackendPagination: true,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());

      store.loadPage$({ page: 1, pageSize: 10 });

      setTimeout(() => {
        expect(store.entities().length).toBe(2);
        expect(store.currentPage?.()).toBe(1);
        expect(store.totalResults?.()).toBe(2);
        done();
      }, 100);
    });

    it('should reset store to initial state', () => {
      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());

      store.addMany([
        { id: 1, name: 'Test 1' } as TestEntity,
        { id: 2, name: 'Test 2' } as TestEntity,
      ]);
      store.setError('Error');
      store.setSelectedEntities([{ id: 1, name: 'Test 1' } as TestEntity]);

      store.reset();

      expect(store.entities().length).toBe(0);
      expect(store.error()).toBeUndefined();
      expect(store.selectedEntities()).toEqual([]);
      expect(store.loading()).toBe(false);
    });
  });

  describe('Configuration Options', () => {
    it('should disable success messages when configured', (done: DoneFn) => {
      const entity: TestEntity = { id: 1, name: 'Test' };
      mockService.add.and.returnValue(of(entity));

      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
          showSuccessMessages: false,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());

      store.add$({ name: 'Test' });

      setTimeout(() => {
        expect(mockMessageService.add).not.toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should disable error messages when configured', (done: DoneFn) => {
      const error = new Error('Test error');
      mockService.add.and.returnValue(throwError(() => error));

      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
          showErrorMessages: false,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());

      store.add$({ name: 'Test' });

      setTimeout(() => {
        expect(mockMessageService.add).not.toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should transform create response', (done: DoneFn) => {
      const response = { data: { id: 1, name: 'Test' } };
      mockService.add.and.returnValue(of(response));

      const TestStore = signalStore(
        ...createEntityStoreConfig({
          storeName: 'TestStore',
          serviceToken: MockTestService,
          transformCreateResponse: (res: any) => res.data,
        })
      );

      const store = TestBed.runInInjectionContext(() => new TestStore());

      store.add$({ name: 'Test' });

      setTimeout(() => {
        expect(store.entities().length).toBe(1);
        expect(store.entities()[0].name).toBe('Test');
        done();
      }, 100);
    });
  });
});
