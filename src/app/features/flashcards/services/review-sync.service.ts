import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  CreateReviewLogRequest,
  Flashcard,
  ReviewSource,
  SwipeOutcome,
  UpdateFlashcardReviewRequest
} from '../models/flashcard.model';
import { applySm2, Sm2Result } from '../utils/spaced-repetition.util';
import { FlashcardsService } from './flashcards.service';
import { ReviewLogService } from './review-log.service';

const QUEUE_KEY = 'oinkmed.pending-reviews';

type PendingReview = {
  cardId: string;
  review: UpdateFlashcardReviewRequest;
  log: CreateReviewLogRequest;
};

/**
 * Salva l'esito di un ripasso: aggiorna lo stato SM-2 della card e ne registra
 * lo storico. Offline (o con Supabase irraggiungibile) l'esito finisce in una
 * coda su localStorage e viene rigiocato appena la rete torna: si studia in
 * metropolitana senza perdere i progressi.
 */
@Injectable({ providedIn: 'root' })
export class ReviewSyncService {
  private readonly flashcardsService = inject(FlashcardsService);
  private readonly reviewLogService = inject(ReviewLogService);

  /** Ripassi non ancora sincronizzati: la UI lo mostra. */
  readonly pendingCount = signal(this.readQueue().length);
  private flushing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => void this.flush());
      if (navigator.onLine) {
        void this.flush();
      }
    }
  }

  /** Calcola il nuovo stato della card e prova a persisterlo. */
  async submit(card: Flashcard, outcome: SwipeOutcome, source: ReviewSource): Promise<Sm2Result> {
    const next = applySm2(card, outcome);
    const review: UpdateFlashcardReviewRequest = {
      known_count: next.known_count,
      unknown_count: next.unknown_count,
      last_seen_at: next.last_seen_at,
      next_review_at: next.next_review_at,
      mastery_level: next.mastery_level,
      ease_factor: next.ease_factor,
      interval_days: next.interval_days,
      repetitions: next.repetitions
    };
    const log: CreateReviewLogRequest = {
      flashcard_id: card.id,
      outcome,
      subject: card.subject,
      source
    };

    try {
      await this.persist({ cardId: card.id, review, log });
    } catch (e) {
      console.error('Ripasso non sincronizzato, messo in coda', e);
      this.enqueue({ cardId: card.id, review, log });
    }

    return next;
  }

  /** Rigioca la coda in ordine; si ferma al primo errore per non perdere l'ordine. */
  async flush(): Promise<void> {
    if (this.flushing) {
      return;
    }
    this.flushing = true;

    try {
      let queue = this.readQueue();
      while (queue.length > 0) {
        try {
          await this.persist(queue[0]);
        } catch {
          return;
        }
        queue = queue.slice(1);
        this.writeQueue(queue);
      }
    } finally {
      this.flushing = false;
    }
  }

  private async persist(pending: PendingReview): Promise<void> {
    await firstValueFrom(this.flashcardsService.updateReview(pending.cardId, pending.review));
    // Lo storico e secondario: se fallisce solo lui, il ripasso resta salvato.
    try {
      await firstValueFrom(this.reviewLogService.add(pending.log));
    } catch (e) {
      console.error('Storico ripasso non salvato', e);
    }
  }

  private enqueue(pending: PendingReview): void {
    this.writeQueue([...this.readQueue(), pending]);
  }

  private readQueue(): PendingReview[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeQueue(queue: PendingReview[]): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('Coda ripassi non salvata', e);
    }
    this.pendingCount.set(queue.length);
  }
}
