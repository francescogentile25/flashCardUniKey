import { inject, Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { EntityResponse } from "../models/responses/entity.response";
import { environment } from "../../../../environments/environment";
import { NewEntityRequest } from "../models/requests/new-entity.request";
import { NewManyEntityRequest } from "../models/requests/new-many-entity.request";
import { EditEntityRequest } from "../models/requests/edit-entity.request";
import { PatchEntityRequest } from "../models/requests/patch-entity.request";
import { DeleteEntityResponse } from "../models/responses/delete-entity.response";
import { PageOptionsModel, PageOptionsRequest } from "../../../core/models/page-options.model";

@Injectable({
  providedIn: 'root',
})
export class ExampleComponentService {
  private http = inject(HttpClient);

  // I nomi dei metodi devono combiaciare con i metodi di BaseEntityService.
  // IMPORTANTE: non sono tutti obbligatori, se non servono si possono omettere

  // export interface BaseEntityService<T extends BaseEntity> {
  //   getAll?(): Observable<T[]>;
  //   getById?(id: number | string): Observable<T>;
  //   add?(request: Omit<T, 'id'>): Observable<T>;
  //   addMany?(requests: Omit<T, 'id'>[]): Observable<T[]>;
  //   edit?(request: T): Observable<T>;
  //   patch?(request: Partial<T>): Observable<T>;
  //   delete?(request: number | string): Observable<any>;
  //   deleteMany?(requests: (number | string)[]): Observable<any>;
  //   getPage?(request: PageOptionsRequest): Observable<PageOptionsModel<T>>;
  // }

  getAll = (): Observable<EntityResponse[]> =>
    this.http.get<EntityResponse[]>(`${ environment.apiUrl }/entity`, { withCredentials: true });

  getById = (id: number): Observable<EntityResponse> =>
    this.http.get<EntityResponse>(`${ environment.apiUrl }/entity/${ id }`, { withCredentials: true });

  add = (request: NewEntityRequest): Observable<EntityResponse> =>
    this.http.post<EntityResponse>(`${ environment.apiUrl }/entity`, request, { withCredentials: true });

  addMany = (request: NewManyEntityRequest): Observable<EntityResponse[]> =>
  this.http.post<EntityResponse[]>(`${ environment.apiUrl }/entity/many`, request, { withCredentials: true });

  edit = (request: EditEntityRequest): Observable<EntityResponse> =>
    this.http.put<EntityResponse>(`${ environment.apiUrl }/entity`, request, { withCredentials: true });

  patch = (request: PatchEntityRequest): Observable<EntityResponse> =>
    this.http.patch<EntityResponse>(`${ environment.apiUrl }/entity`, request, { withCredentials: true });

  delete = (request: number): Observable<DeleteEntityResponse> =>
    this.http.delete<DeleteEntityResponse>(`${ environment.apiUrl }/entity/${ request }`, { body: request, withCredentials: true });

  deleteMany = (request: number[]): Observable<DeleteEntityResponse> =>
    this.http.delete<DeleteEntityResponse>(`${ environment.apiUrl }/entity/many/`, { body: { ids: request }, withCredentials: true });

  // Chiamata per la paginazione lato backend
  // IMPORTANTE: non modificare PageOptionsRequest ne PageOptionsModel<T>
  // Lo store non terrà in memoria le entità caricate in precedenza se si cambia pagina.
  getPage = (request: PageOptionsRequest): Observable<PageOptionsModel<EntityResponse>> =>
    this.http.post<PageOptionsModel<EntityResponse>>(`${ environment.apiUrl }/entity/pagination`, request, { withCredentials: true });

  // CHIAMATE CUSTOM
  // Che non fanno parte dei metodi di BaseEntityService, ma che servono specificamente per un entità apposita
  // Es. Entity ha una proprietà K[], ma che K a sua volta è un'altra entità che ha
  // un suo store apparte e che quindi deve essere mappato.
  //
  // Vedi esempio su example-example-component-with-extension.store.ts
  customCallbackFn = (): Observable<EntityResponse[]> =>
    this.http.get<EntityResponse[]>(`${ environment.apiUrl }/entity`, { withCredentials: true });
}
