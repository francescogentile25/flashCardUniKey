/**
 * EXAMPLE: How to use the base store with custom request and response types
 *
 * This example demonstrates how to create a store where:
 * - The entity type (T) is different from the create/update request types
 * - The API response types can be different from the entity type
 * - You have full type safety for all CRUD operations
 * - You can transform responses before storing them
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { signalStore } from '@ngrx/signals';
import {
  BaseEntity,
  BaseEntityService,
  createEntityStoreConfig
} from './base.store';

// ============================================================================
// 1. Define your entity type (what you store and display)
// ============================================================================
export interface User extends BaseEntity {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roleIds: number[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 2. Define your custom request types (DTOs)
// ============================================================================

// Request body for creating a new user
export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleIds: number[];
}

// Request body for updating a user (maybe you don't want to send password)
export interface UpdateUserRequest {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roleIds: number[];
}

// Request body for partial updates
export interface PatchUserRequest {
  id: number;
  firstName?: string;
  lastName?: string;
  roleIds?: number[];
}

// ============================================================================
// 3. Define your custom response types (if API returns different structure)
// ============================================================================

// Example: API returns a wrapper with metadata
export interface CreateUserResponse {
  data: User;
  message: string;
  timestamp: string;
}

export interface UpdateUserResponse {
  data: User;
  affectedRows: number;
}

export interface DeleteUserResponse {
  success: boolean;
  deletedId: number;
  message: string;
  timestamp: string;
}

// ============================================================================
// 4. Create your service that implements BaseEntityService with custom types
// ============================================================================
@Injectable({ providedIn: 'root' })
export class UserService implements BaseEntityService<
  User,                    // T: Entity type
  CreateUserRequest,       // TCreate: What you send to create
  UpdateUserRequest,       // TUpdate: What you send to update
  PatchUserRequest,        // TPatch: What you send to patch
  number,                  // TDelete: What you send to delete (usually just ID)
  CreateUserResponse,      // TCreateResponse: What the API returns from create
  UpdateUserResponse,      // TUpdateResponse: What the API returns from update
  User,                    // TPatchResponse: What the API returns from patch (could be different)
  DeleteUserResponse       // TDeleteResponse: What the API returns from delete
> {

  getAll(): Observable<User[]> {
    // Implementation...
    throw new Error('Not implemented');
  }

  getById(id: number): Observable<User> {
    // Implementation...
    throw new Error('Not implemented');
  }

  // Note: Returns CreateUserResponse (wrapper), not User directly!
  add(request: CreateUserRequest): Observable<CreateUserResponse> {
    // The API receives CreateUserRequest (with password)
    // and returns CreateUserResponse (wrapper with user data + metadata)
    throw new Error('Not implemented');
  }

  // Note: Returns UpdateUserResponse (wrapper), not User directly!
  edit(request: UpdateUserRequest): Observable<UpdateUserResponse> {
    // The API receives UpdateUserRequest
    // and returns UpdateUserResponse (wrapper with user data + metadata)
    throw new Error('Not implemented');
  }

  // Note: Returns User directly (no wrapper for patch in this example)
  patch(request: PatchUserRequest): Observable<User> {
    // The API receives PatchUserRequest (partial data)
    // and returns the updated User directly
    throw new Error('Not implemented');
  }

  // Note: Returns DeleteUserResponse (wrapper with metadata)
  delete(id: number): Observable<DeleteUserResponse> {
    // The API receives the ID
    // and returns DeleteUserResponse with success info and metadata
    throw new Error('Not implemented');
  }
}

// ============================================================================
// 5. Create your store with explicit generic types and transformers
// ============================================================================
export const UserStore = signalStore(
  { providedIn: 'root' },

  // Pass all the generic types explicitly to get proper type checking
  ...createEntityStoreConfig<
    User,                  // T: Entity type
    CreateUserRequest,     // TCreate: Create request type
    UpdateUserRequest,     // TUpdate: Update request type
    PatchUserRequest,      // TPatch: Patch request type
    number,                // TDelete: Delete request type
    CreateUserResponse,    // TCreateResponse: Create response type
    UpdateUserResponse,    // TUpdateResponse: Update response type
    User,                  // TPatchResponse: Patch response type
    DeleteUserResponse     // TDeleteResponse: Delete response type
  >({
    storeName: 'User Store',
    serviceToken: UserService,
    showSuccessMessages: true,
    showErrorMessages: true,

    // Transformer functions to extract the entity from wrapped responses
    transformCreateResponse: (response) => response.data,
    transformUpdateResponse: (response) => response.data,
    // No transformer needed for patch since it already returns User
    // For delete, you can transform the response or just store it as-is
    transformDeleteResponse: (response) => ({
      success: response.success,
      message: response.message
    })
  })
);

// ============================================================================
// 6. Usage in components (fully type-safe!)
// ============================================================================

/*
import { Component, inject } from '@angular/core';
import { UserStore } from './user.store';

@Component({
  // ...
})
export class UserComponent {
  readonly store = inject(UserStore);

  createUser() {
    // ✅ Type-safe: you must provide CreateUserRequest
    this.store.add$({
      email: 'john@example.com',
      password: 'secret123',
      firstName: 'John',
      lastName: 'Doe',
      roleIds: [1, 2]
    });
  }

  updateUser() {
    // ✅ Type-safe: you must provide UpdateUserRequest
    this.store.edit$({
      id: 1,
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      roleIds: [1, 2, 3]
      // Note: no password field needed for updates!
    });
  }

  patchUser() {
    // ✅ Type-safe: you must provide PatchUserRequest
    this.store.patch$({
      id: 1,
      firstName: 'Johnny'  // Only update the first name
    });
  }

  deleteUser() {
    // ✅ Type-safe: you must provide number (or string)
    this.store.delete$(1);

    // After deletion, you can access the response
    // The store keeps track of: lastDeleted (the ID) and lastDeletedResponse
  }

  // The store still contains User entities (not the request types)
  users = this.store.entities;  // Signal<User[]>
  selectedUser = this.store.selectedEntity;  // Signal<User | undefined>

  // Access the last deleted response (useful for success messages, logging, etc.)
  lastDeletedResponse = this.store.lastDeletedResponse;  // Signal<any | undefined>
}
*/

// ============================================================================
// 7. SIMPLE EXAMPLE: When request/response types match the entity
// ============================================================================

/*
If your API uses the same types for requests and responses as the entity,
you don't need to specify the generic types - they'll default to T:

export const SimpleUserStore = signalStore(
  { providedIn: 'root' },

  // Just specify T, the rest defaults to Omit<T, 'id'>, T, Partial<T>, etc.
  ...createEntityStoreConfig<User>({
    storeName: 'Simple User Store',
    serviceToken: SimpleUserService,
  })
);

// In this case (all defaults):
// - add$ accepts Omit<User, 'id'> and expects service to return User
// - edit$ accepts User and expects service to return User
// - patch$ accepts Partial<User> and expects service to return User
// - delete$ accepts number | string
*/

// ============================================================================
// 8. Delete Response Handling
// ============================================================================

/*
The base store now tracks delete operation responses in addition to the deleted ID.

After a delete operation completes:
- `lastDeleted`: stores the ID of the deleted entity (number | string | undefined)
- `lastDeletedResponse`: stores the transformed response from the API (any | undefined)

This is useful when:
- The API returns success messages you want to display
- You need metadata like timestamps or affected rows count
- You want to log or track deletion details
- You need to perform follow-up actions based on the response

Example:
```typescript
// In your component
deleteUser(id: number) {
  this.store.delete$(id);

  // React to the deletion
  effect(() => {
    const response = this.store.lastDeletedResponse();
    if (response?.success) {
      console.log('Delete successful:', response.message);
    }
  });
}
```
*/

// ============================================================================
// 9. When to use transformers vs transforming in the service
// ============================================================================

/*
APPROACH 1: Transform in the base store (recommended for reusability)
- Use transformer functions in the store config
- Keeps the service simple and focused on HTTP calls
- The store handles the transformation consistently
- Best when the API response structure is consistent across the app

APPROACH 2: Transform in the service
- Transform the response inside the service method before returning
- The service returns Observable<T> directly
- No transformers needed in the store config
- Best for one-off transformations or complex logic

Example of transforming in the service:

@Injectable({ providedIn: 'root' })
export class UserServiceWithTransform implements BaseEntityService<User> {
  add(request: Omit<User, 'id'>): Observable<User> {
    return this.http.post<CreateUserResponse>('/api/users', request).pipe(
      map(response => response.data)  // Transform here in the service
    );
  }
}

// Then you can use the simple store config without transformers:
export const UserStoreSimple = signalStore(
  { providedIn: 'root' },
  ...createEntityStoreConfig<User>({
    storeName: 'User Store',
    serviceToken: UserServiceWithTransform,
  })
);
*/
