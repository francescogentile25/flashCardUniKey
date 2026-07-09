import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreateReviewLogRequest, ReviewLogEntry } from '../models/flashcard.model';

@Injectable({
  providedIn: 'root'
})
export class ReviewLogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.supabase.url}/rest/v1/review_log`;
  private readonly headers = new HttpHeaders({
    apikey: environment.supabase.publishableKey,
    Authorization: `Bearer ${environment.supabase.publishableKey}`
  });

  add(request: CreateReviewLogRequest): Observable<void> {
    return this.http.post<void>(this.baseUrl, request, { headers: this.headers });
  }

  /** Ripassi dal giorno indicato in poi, dal piu recente. */
  getSince(since: Date): Observable<ReviewLogEntry[]> {
    const iso = encodeURIComponent(since.toISOString());
    return this.http.get<ReviewLogEntry[]>(
      `${this.baseUrl}?select=*&reviewed_at=gte.${iso}&order=reviewed_at.desc`,
      { headers: this.headers }
    );
  }
}
