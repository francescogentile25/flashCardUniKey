import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { UserResponse } from "../models/responses/user.response";
import { environment } from "../../../../environments/environment";
import { LoginRequest } from "../models/requests/login.request";
import { LoginResponse } from "../models/responses/login.response";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  http = inject(HttpClient);

  me(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${ environment.apiUrl }/me`, { withCredentials: true });
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${ environment.apiUrl }/login`, request, { withCredentials: true });
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${ environment.apiUrl }/logout`, { }, { withCredentials: true });
  }
}
