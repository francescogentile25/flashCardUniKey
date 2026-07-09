import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CreateFlashcardRequest,
  Flashcard,
  UpdateFlashcardReviewRequest
} from '../models/flashcard.model';

export type GeneratedCard = CreateFlashcardRequest;

@Injectable({
  providedIn: 'root'
})
export class FlashcardsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.supabase.url}/rest/v1/flashcards`;
  private readonly functionsUrl = `${environment.supabase.url}/functions/v1/generate-flashcards`;
  private readonly headers = new HttpHeaders({
    apikey: environment.supabase.publishableKey,
    Authorization: `Bearer ${environment.supabase.publishableKey}`,
    Prefer: 'return=representation'
  });

  // Niente `Prefer`: è un header PostgREST e la CORS della Edge Function non lo consente.
  private readonly functionHeaders = new HttpHeaders({
    apikey: environment.supabase.publishableKey,
    Authorization: `Bearer ${environment.supabase.publishableKey}`
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

  createMany(requests: CreateFlashcardRequest[]): Observable<Flashcard[]> {
    return this.http.post<Flashcard[]>(this.baseUrl, requests, {
      headers: this.headers
    });
  }

  generateFromText(text: string, count: number): Observable<{ cards: GeneratedCard[] }> {
    return this.http.post<{ cards: GeneratedCard[] }>(
      this.functionsUrl,
      { text, count },
      { headers: this.functionHeaders }
    );
  }

  updateDetails(id: string, request: CreateFlashcardRequest): Observable<Flashcard[]> {
    return this.http.patch<Flashcard[]>(`${this.baseUrl}?id=eq.${id}`, request, {
      headers: this.headers
    });
  }

  updateReview(id: string, request: UpdateFlashcardReviewRequest): Observable<Flashcard[]> {
    return this.http.patch<Flashcard[]>(`${this.baseUrl}?id=eq.${id}`, request, {
      headers: this.headers
    });
  }

  delete(id: string): Observable<Flashcard[]> {
    return this.http.delete<Flashcard[]>(`${this.baseUrl}?id=eq.${id}`, {
      headers: this.headers
    });
  }
}
