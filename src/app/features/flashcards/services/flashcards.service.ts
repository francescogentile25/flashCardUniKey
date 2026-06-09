import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CreateFlashcardRequest,
  Flashcard,
  UpdateFlashcardReviewRequest
} from '../models/flashcard.model';

@Injectable({
  providedIn: 'root'
})
export class FlashcardsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.supabase.url}/rest/v1/flashcards`;
  private readonly headers = new HttpHeaders({
    apikey: environment.supabase.publishableKey,
    Authorization: `Bearer ${environment.supabase.publishableKey}`,
    Prefer: 'return=representation'
  });

  getAll(): Observable<Flashcard[]> {
    return this.http.get<Flashcard[]>(`${this.baseUrl}?select=*&order=created_at.asc`, {
      headers: this.headers
    });
  }

  create(request: CreateFlashcardRequest): Observable<Flashcard[]> {
    return this.http.post<Flashcard[]>(this.baseUrl, request, {
      headers: this.headers
    });
  }

  updateReview(id: string, request: UpdateFlashcardReviewRequest): Observable<Flashcard[]> {
    return this.http.patch<Flashcard[]>(`${this.baseUrl}?id=eq.${id}`, request, {
      headers: this.headers
    });
  }
}
